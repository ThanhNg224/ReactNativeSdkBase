import { SdkErrorCodes, type SdkErrorCode } from './error-codes.js';
import { SdkError } from './sdk-error.js';
import type { AbortReason } from '../client/operation-lifetime.js';
import { sdkNativeUnavailableErrorCode } from '../native/native-bridge.js';

interface FailureAdvice {
  readonly code: SdkErrorCode;
  readonly isRetryable: boolean;
}

/** The single HTTP status table. Only called for non-2xx statuses. */
export function failureForStatus(statusCode: number): FailureAdvice {
  if (statusCode === 401 || statusCode === 403) {
    return { code: SdkErrorCodes.unauthorized, isRetryable: false };
  }
  if (statusCode === 429) {
    return { code: SdkErrorCodes.rateLimited, isRetryable: true };
  }
  if (statusCode >= 500) {
    return { code: SdkErrorCodes.server, isRetryable: true };
  }
  return { code: SdkErrorCodes.client, isRetryable: false };
}

/** The single native failure table. */
export function nativeFailure(error: unknown, requestId: string): SdkError {
  const nativeCode =
    typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  if (nativeCode === sdkNativeUnavailableErrorCode) {
    return new SdkError({
      code: SdkErrorCodes.nativeUnavailable,
      message: 'The SDK native module is not linked into this app.',
      isRetryable: false,
      requestId,
      cause: error,
    });
  }
  return new SdkError({
    code: SdkErrorCodes.native,
    message: 'The SDK native module rejected the call.',
    isRetryable: false,
    requestId,
    cause: error,
  });
}

/** The executor's failure for an uninterpretable successful result. */
export function invalidResponse(requestId: string, cause: unknown, statusCode?: number): SdkError {
  return new SdkError({
    code: SdkErrorCodes.invalidResponse,
    message: 'The result could not be interpreted.',
    isRetryable: false,
    requestId,
    ...(statusCode === undefined ? {} : { statusCode }),
    cause,
  });
}

/** The executor's failure for an operation that was aborted. */
export function abortFailure(reason: AbortReason, requestId: string): SdkError {
  return reason === 'timeout'
    ? new SdkError({
        code: SdkErrorCodes.timeout,
        message: 'The operation timed out.',
        isRetryable: true,
        requestId,
      })
    : new SdkError({
        code: SdkErrorCodes.cancelled,
        message: 'The operation was cancelled.',
        isRetryable: false,
        requestId,
      });
}
