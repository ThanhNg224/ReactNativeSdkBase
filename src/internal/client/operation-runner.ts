import { SdkErrorCodes } from '../errors/error-codes.js';
import { SdkError, isSdkError } from '../errors/sdk-error.js';
import type { SdkObserver, SdkOperationEvent } from '../observability/operation-event.js';
import { sdkVersion } from '../version.js';
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

type AbortReason = 'timeout' | 'cancelled';

interface ActiveOperation {
  abort(): void;
  readonly settled: Promise<unknown>;
}

/**
 * The one path every public operation takes: closed check, request ID, timeout,
 * signal linking, close cancellation, error normalisation, and exactly one
 * terminal event.
 */
export class SdkOperationRunner {
  private readonly active = new Set<ActiveOperation>();
  private closing: Promise<void> | undefined;

  constructor(
    private readonly timeoutMs: number,
    private readonly observer: SdkObserver | undefined,
    readonly seams: RunnerSeams
  ) {}

  /**
   * Runs `body`. `mapUnknown` turns a non-`SdkError` rejection from `body` into
   * the capability family's failure.
   */
  run<T>(
    operation: string,
    options: SdkOperationOptions | undefined,
    body: (context: OperationContext) => Promise<T>,
    mapUnknown: (error: unknown, requestId: string) => SdkError
  ): Promise<T> {
    if (this.closing !== undefined) {
      return Promise.reject(new Error('SdkClient is closed.'));
    }
    const startedAt = this.seams.now();
    const controller = new AbortController();
    const context: OperationContext = {
      requestId: this.seams.createRequestId(),
      signal: controller.signal,
    };
    let abortReason: AbortReason | undefined;
    let rejectAborted: (reason: AbortReason) => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAborted = reject;
    });
    const abort = (reason: AbortReason): void => {
      if (abortReason !== undefined) return;
      abortReason = reason;
      controller.abort();
      rejectAborted(reason);
    };

    const hostSignal = options?.signal;
    const onHostAbort = (): void => abort('cancelled');
    hostSignal?.addEventListener('abort', onHostAbort);
    const timer = setTimeout(() => abort('timeout'), this.timeoutMs);

    const execute = async (): Promise<T> => {
      if (hostSignal?.aborted === true) abort('cancelled');
      if (abortReason !== undefined) await aborted;
      const work = body(context);
      // The losing side of the race must never surface as an unhandled rejection.
      work.catch(() => {});
      return Promise.race([work, aborted]);
    };

    const settled = execute().then(
      (value) => {
        this.emit(operation, context, startedAt, undefined);
        return value;
      },
      (error: unknown) => {
        const failure =
          abortReason !== undefined
            ? this.abortFailure(abortReason, context)
            : isSdkError(error)
              ? error
              : mapUnknown(error, context.requestId);
        this.emit(operation, context, startedAt, failure);
        throw failure;
      }
    );
    const entry: ActiveOperation = {
      abort: () => abort('cancelled'),
      settled: settled.catch(() => {}),
    };
    this.active.add(entry);
    entry.settled.then(() => {
      clearTimeout(timer);
      hostSignal?.removeEventListener('abort', onHostAbort);
      this.active.delete(entry);
    });
    return settled;
  }

  /** Rejects new operations, cancels in-flight ones, and waits for them. Idempotent. */
  close(): Promise<void> {
    if (this.closing === undefined) {
      const inFlight = [...this.active];
      for (const operation of inFlight) operation.abort();
      this.closing = Promise.all(inFlight.map((operation) => operation.settled)).then(() => {});
    }
    return this.closing;
  }

  private abortFailure(reason: AbortReason, context: OperationContext): SdkError {
    return reason === 'timeout'
      ? new SdkError({
          code: SdkErrorCodes.timeout,
          message: 'The operation timed out.',
          isRetryable: true,
          requestId: context.requestId,
        })
      : new SdkError({
          code: SdkErrorCodes.cancelled,
          message: 'The operation was cancelled.',
          isRetryable: false,
          requestId: context.requestId,
        });
  }

  private emit(
    operation: string,
    context: OperationContext,
    startedAt: number,
    failure: SdkError | undefined
  ): void {
    const observer = this.observer;
    if (observer === undefined) return;
    const statusCode = failure?.statusCode ?? context.statusCode;
    const event: SdkOperationEvent = Object.freeze({
      operation,
      requestId: context.requestId,
      sdkVersion,
      outcome: failure === undefined ? 'succeeded' : 'failed',
      elapsedMs: Math.max(0, this.seams.now() - startedAt),
      ...(statusCode === undefined ? {} : { statusCode }),
      ...(failure === undefined
        ? {}
        : { failureCode: failure.code, isRetryable: failure.isRetryable }),
    });
    try {
      const result: unknown = observer.onOperation(event);
      if (typeof (result as PromiseLike<unknown> | undefined)?.then === 'function') {
        (result as Promise<unknown>).then(undefined, () => {});
      }
    } catch {
      // Observer failures never affect the operation.
    }
  }
}
