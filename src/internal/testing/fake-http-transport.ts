import type {
  SdkHttpRequest,
  SdkHttpResponse,
  SdkHttpTransport,
} from '../transport/http-transport.js';

/**
 * A response the fake returns. `headers` and `body` default to empty.
 *
 * @public
 */
export interface FakeSdkHttpResponse {
  /** The HTTP status code. */
  readonly statusCode: number;
  /** Response headers; names are lower-cased by the fake. */
  readonly headers?: Readonly<Record<string, string>>;
  /** The response body. */
  readonly body?: string;
}

/**
 * Computes the fake's answer for one request. Return a response, or throw to
 * simulate a transport failure.
 *
 * @public
 */
export type FakeSdkHttpHandler = (
  request: SdkHttpRequest
) => FakeSdkHttpResponse | Promise<FakeSdkHttpResponse>;

type Step =
  | { readonly kind: 'respond'; readonly response: FakeSdkHttpResponse }
  | { readonly kind: 'fail'; readonly error: unknown }
  | { readonly kind: 'hang' };

/**
 * A deterministic `SdkHttpTransport` for tests and demos. Not a
 * production transport.
 *
 * @remarks
 * Queued steps are consumed in order; when the queue is empty the handler, if
 * any, answers. With neither, `send` rejects, which the SDK maps to
 * `transport`. Every step honours the abort signal.
 *
 * @public
 */
export class FakeSdkHttpTransport implements SdkHttpTransport {
  private readonly steps: Step[] = [];
  private readonly received: SdkHttpRequest[] = [];
  private handler: FakeSdkHttpHandler | undefined;
  private closeCount = 0;

  /** Every request the fake received, in order. */
  get requests(): readonly SdkHttpRequest[] {
    return [...this.received];
  }

  /** How many times `close()` was called. */
  get closeCalls(): number {
    return this.closeCount;
  }

  /** Queues one response. */
  enqueueResponse(response: FakeSdkHttpResponse): this {
    this.steps.push({ kind: 'respond', response });
    return this;
  }

  /** Queues one transport failure. */
  enqueueFailure(error: unknown = new Error('Fake transport failure.')): this {
    this.steps.push({ kind: 'fail', error });
    return this;
  }

  /** Queues one request that never answers until it is aborted. */
  enqueueHang(): this {
    this.steps.push({ kind: 'hang' });
    return this;
  }

  /** Answers every request once the queue is empty. */
  setHandler(handler: FakeSdkHttpHandler | undefined): this {
    this.handler = handler;
    return this;
  }

  /** Records `request` and answers with the next queued step or the handler. */
  send(request: SdkHttpRequest, signal: AbortSignal): Promise<SdkHttpResponse> {
    this.received.push(request);
    const step = this.steps.shift();
    return new Promise<SdkHttpResponse>((resolve, reject) => {
      const onAbort = (): void => reject(new Error('Fake request aborted.'));
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      const answer = async (): Promise<FakeSdkHttpResponse> => {
        if (step === undefined) {
          if (this.handler === undefined) {
            throw new Error('FakeSdkHttpTransport has no queued response or handler.');
          }
          return this.handler(request);
        }
        if (step.kind === 'fail') throw step.error;
        if (step.kind === 'hang') return new Promise<never>(() => {});
        return step.response;
      };
      answer().then(
        (response) => {
          signal.removeEventListener('abort', onAbort);
          const headers: Record<string, string> = {};
          for (const [name, value] of Object.entries(response.headers ?? {})) {
            headers[name.toLowerCase()] = value;
          }
          resolve({ statusCode: response.statusCode, headers, body: response.body ?? '' });
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
      );
    });
  }

  /** Counts the call; the fake holds no resources. */
  close(): Promise<void> {
    this.closeCount += 1;
    return Promise.resolve();
  }
}
