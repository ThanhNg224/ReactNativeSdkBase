import { isSdkError, SdkErrorCodes, type SdkErrorCode } from 'react-native-sdk-base';

export interface AppFailure {
  readonly code: SdkErrorCode | 'unknown';
  /** Host-owned, user-facing copy. */
  readonly message: string;
  readonly requestId?: string;
  readonly isRetryable: boolean;
}

/** Throwable carrier so TanStack Query receives a real Error that is also an AppFailure. */
export class AppFailureError extends Error implements AppFailure {
  readonly code: AppFailure['code'];
  readonly requestId?: string;
  readonly isRetryable: boolean;

  constructor(failure: AppFailure) {
    super(failure.message);
    this.name = 'AppFailureError';
    this.code = failure.code;
    this.isRetryable = failure.isRetryable;
    if (failure.requestId !== undefined) this.requestId = failure.requestId;
  }
}

const copy: Record<SdkErrorCode, string> = {
  [SdkErrorCodes.cancelled]: 'The request was cancelled.',
  [SdkErrorCodes.timeout]: 'The request took too long. Please try again.',
  [SdkErrorCodes.transport]: 'Could not reach the service. Check your connection and try again.',
  [SdkErrorCodes.unauthorized]: 'The app is not authorised to use this service.',
  [SdkErrorCodes.client]: 'The service rejected the request.',
  [SdkErrorCodes.rateLimited]: 'Too many requests. Please wait a moment and try again.',
  [SdkErrorCodes.server]: 'The service is having problems. Please try again later.',
  [SdkErrorCodes.invalidResponse]: 'The service returned something unexpected.',
  [SdkErrorCodes.nativeUnavailable]:
    'The native module is not available in this build. Use a development build instead of Expo Go.',
  [SdkErrorCodes.native]: 'The device could not provide this information.',
};

export function toAppFailure(error: unknown): AppFailure {
  if (isSdkError(error)) {
    return {
      code: error.code,
      message: copy[error.code],
      requestId: error.requestId,
      isRetryable: error.isRetryable,
    };
  }
  return { code: 'unknown', message: 'Something went wrong.', isRetryable: false };
}

export function toAppFailureError(error: unknown): AppFailureError {
  return new AppFailureError(toAppFailure(error));
}
