import type { SdkErrorCode } from './error-codes.js';

const brand = Symbol.for('react-native-sdk-base.SdkError');

/**
 * The fields used to construct an {@link SdkError}.
 *
 * @public
 */
export interface SdkErrorInit {
  /** The stable failure code. */
  readonly code: SdkErrorCode;
  /** Concise English diagnostic text for developers; never shown to end users. */
  readonly message: string;
  /** Whether retrying the same operation later may succeed. */
  readonly isRetryable: boolean;
  /** The operation's correlation ID. Must be non-empty. */
  readonly requestId: string;
  /** The HTTP status, when a response was received. */
  readonly statusCode?: number;
  /** Diagnostic detail with no compatibility guarantee. */
  readonly cause?: unknown;
}

/**
 * The only error an SDK operation rejects with for expected runtime failures.
 *
 * @remarks
 * Detect it with {@link isSdkError} rather than `instanceof`, which fails when a
 * bundle contains two copies of the package. `message` never contains the
 * cause, URL, headers, body, or API key. `cause` is non-enumerable, so
 * `JSON.stringify` and object spread leave it out.
 *
 * @public
 */
export class SdkError extends Error {
  /** Always `'SdkError'`. */
  override readonly name = 'SdkError';
  /** The stable failure code. */
  readonly code: SdkErrorCode;
  /** Advice for the host; the SDK never retries automatically. */
  readonly isRetryable: boolean;
  /** The HTTP status, when a response was received. */
  readonly statusCode: number | undefined;
  /** The operation's correlation ID; safe to show to support staff. */
  readonly requestId: string;
  /**
   * Creates an error. SDK operations construct these themselves; hosts need
   * this only for test doubles.
   *
   * @throws `TypeError` when `requestId` is empty.
   */
  constructor(init: SdkErrorInit) {
    super(init.message);
    if (init.requestId.length === 0) {
      throw new TypeError('SdkError requires a non-empty requestId.');
    }
    this.code = init.code;
    this.isRetryable = init.isRetryable;
    this.statusCode = init.statusCode;
    this.requestId = init.requestId;
    Object.defineProperty(this, 'cause', { value: init.cause, enumerable: false });
    Object.defineProperty(this, brand, { value: true, enumerable: false });
  }
}

/**
 * Whether `value` is an {@link SdkError}, including one created by another copy
 * of this package in the same bundle.
 *
 * @public
 */
export function isSdkError(value: unknown): value is SdkError {
  return (
    typeof value === 'object' && value !== null && (value as { [brand]?: unknown })[brand] === true
  );
}
