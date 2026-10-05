import type { SdkErrorCode } from '../errors/error-codes.js';

/**
 * One terminal record per public SDK operation.
 *
 * @remarks
 * Events never contain credentials, the URL, path, query, headers, bodies,
 * native error messages, raw errors, or stack traces.
 *
 * @public
 */
export interface SdkOperationEvent {
  /** Static operation name, for example `'health.check'`. */
  readonly operation: string;
  /** The operation's correlation ID. */
  readonly requestId: string;
  /** The SDK version that ran the operation. */
  readonly sdkVersion: string;
  /** Whether the operation resolved or rejected. */
  readonly outcome: 'succeeded' | 'failed';
  /** Wall-clock duration in milliseconds. */
  readonly elapsedMs: number;
  /** The HTTP status, when a response existed. */
  readonly statusCode?: number;
  /** The failure code; present only on failed events. */
  readonly failureCode?: SdkErrorCode;
  /** Retry advice; present only on failed events. */
  readonly isRetryable?: boolean;
}

/**
 * Receives operation events. Observation is off unless the host supplies one.
 *
 * @remarks
 * Exceptions thrown by the observer, and rejections of a returned promise, are
 * swallowed.
 *
 * @public
 */
export interface SdkObserver {
  /** Called once when an operation settles. */
  onOperation(event: SdkOperationEvent): void;
}
