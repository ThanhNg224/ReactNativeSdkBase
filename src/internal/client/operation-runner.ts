import { abortFailure } from '../errors/failure-tables.js';
import { isSdkError, type SdkError } from '../errors/sdk-error.js';
import { notifyObserver } from '../observability/notify-observer.js';
import type { SdkObserver } from '../observability/operation-event.js';
import { sdkVersion } from '../version.js';
import { OperationLifetime } from './operation-lifetime.js';
import type { SdkOperationOptions } from './operation-options.js';

/** What a running operation can see and record. */
export interface OperationContext {
  readonly requestId: string;
  /** Aborts on timeout, the host signal, or client close. */
  readonly signal: AbortSignal;
  /** Set by the HTTP executor once a response exists. */
  statusCode?: number;
}

/** Seams that package tests replace; never reachable from the public entry points. */
export interface RunnerSeams {
  readonly now: () => number;
  readonly createRequestId: () => string;
}

/** Maps a non-`SdkError` rejection to the capability family's failure. */
export type UnknownFailureMapper = (error: unknown, requestId: string) => SdkError;

/**
 * The one path every public operation takes: closed check, request ID, timeout,
 * signal linking, close cancellation, error normalisation, and exactly one
 * terminal event.
 */
export class SdkOperationRunner {
  private readonly inFlight = new Map<OperationLifetime, Promise<unknown>>();
  private closing: Promise<void> | undefined;

  constructor(
    private readonly timeoutMs: number,
    private readonly observer: SdkObserver | undefined,
    private readonly seams: RunnerSeams
  ) {}

  run<T>(
    operation: string,
    options: SdkOperationOptions | undefined,
    body: (context: OperationContext) => Promise<T>,
    mapUnknown: UnknownFailureMapper
  ): Promise<T> {
    if (this.closing !== undefined) {
      return Promise.reject(new Error('SdkClient is closed.'));
    }
    const startedAt = this.seams.now();
    const lifetime = new OperationLifetime(this.timeoutMs, options?.signal);
    const context: OperationContext = {
      requestId: this.seams.createRequestId(),
      signal: lifetime.signal,
    };

    const result = lifetime
      .race(() => body(context))
      .then(
        (value) => {
          this.emit(operation, context, startedAt, undefined);
          return value;
        },
        (error: unknown) => {
          const failure = this.normalise(error, lifetime, context.requestId, mapUnknown);
          this.emit(operation, context, startedAt, failure);
          throw failure;
        }
      );
    this.track(lifetime, result);
    return result;
  }

  /** Rejects new operations, cancels in-flight ones, and waits for them. Idempotent. */
  close(): Promise<void> {
    if (this.closing === undefined) {
      const settled = [...this.inFlight.values()];
      for (const lifetime of this.inFlight.keys()) lifetime.abort('cancelled');
      this.closing = Promise.all(settled).then(() => {});
    }
    return this.closing;
  }

  /** An abort always wins; otherwise keep SDK errors and map everything else. */
  private normalise(
    error: unknown,
    lifetime: OperationLifetime,
    requestId: string,
    mapUnknown: UnknownFailureMapper
  ): SdkError {
    if (lifetime.reason !== undefined) return abortFailure(lifetime.reason, requestId);
    return isSdkError(error) ? error : mapUnknown(error, requestId);
  }

  private track(lifetime: OperationLifetime, result: Promise<unknown>): void {
    const settled = result.then(
      () => {},
      () => {}
    );
    this.inFlight.set(lifetime, settled);
    settled.then(() => {
      lifetime.dispose();
      this.inFlight.delete(lifetime);
    });
  }

  private emit(
    operation: string,
    context: OperationContext,
    startedAt: number,
    failure: SdkError | undefined
  ): void {
    if (this.observer === undefined) return;
    const statusCode = failure?.statusCode ?? context.statusCode;
    notifyObserver(
      this.observer,
      Object.freeze({
        operation,
        requestId: context.requestId,
        sdkVersion,
        outcome: failure === undefined ? 'succeeded' : 'failed',
        elapsedMs: Math.max(0, this.seams.now() - startedAt),
        ...(statusCode === undefined ? {} : { statusCode }),
        ...(failure === undefined
          ? {}
          : { failureCode: failure.code, isRetryable: failure.isRetryable }),
      })
    );
  }
}
