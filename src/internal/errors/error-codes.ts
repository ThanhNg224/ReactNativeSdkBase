/**
 * Stable machine-readable codes carried by {@link SdkError.code}.
 *
 * @remarks
 * Hosts map these codes to their own user-facing copy. Adding, changing, or
 * removing a code is recorded in `CHANGELOG.md`.
 *
 * @public
 */
export const SdkErrorCodes = {
  /** The operation was aborted by its `signal` or by `SdkClient.close()`. */
  cancelled: 'cancelled',
  /** `SdkConfig.requestTimeoutMs` elapsed before the operation finished. */
  timeout: 'timeout',
  /** The HTTP transport failed before a response was received. */
  transport: 'transport',
  /** The server answered HTTP 401 or 403. */
  unauthorized: 'unauthorized',
  /** The server answered an HTTP 4xx other than 401, 403, or 429. */
  client: 'client',
  /** The server answered HTTP 429. */
  rateLimited: 'rate_limited',
  /** The server answered HTTP 5xx. */
  server: 'server',
  /** A successful response or native result could not be interpreted. */
  invalidResponse: 'invalid_response',
  /** The SDK's native module is not linked into the running app. */
  nativeUnavailable: 'native_unavailable',
  /** The SDK's native module rejected the call. */
  native: 'native',
} as const;

/**
 * One of the values of {@link SdkErrorCodes}.
 *
 * @public
 */
export type SdkErrorCode = (typeof SdkErrorCodes)[keyof typeof SdkErrorCodes];
