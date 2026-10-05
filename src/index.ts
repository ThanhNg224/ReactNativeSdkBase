/**
 * A React Native SDK in TypeScript with an Expo native module.
 *
 * Only the declarations exported here and from `react-native-sdk-base/testing`
 * are supported API. Everything under `internal/` may change in any release.
 *
 * @packageDocumentation
 */

export { SdkClient } from './internal/client/sdk-client.js';
export type { SdkClientOptions } from './internal/client/sdk-client.js';
export type { SdkConfig } from './internal/client/config.js';
export type { SdkOperationOptions } from './internal/client/operation-options.js';
export { SdkErrorCodes } from './internal/errors/error-codes.js';
export type { SdkErrorCode } from './internal/errors/error-codes.js';
export { SdkError, isSdkError } from './internal/errors/sdk-error.js';
export type { SdkErrorInit } from './internal/errors/sdk-error.js';
export type { SdkHealth } from './internal/health/health.js';
export type { SdkHealthService } from './internal/health/health-service.js';
export type { SdkDeviceInfo } from './internal/device/device-info.js';
export type { SdkDeviceService } from './internal/device/device-service.js';
export type { SdkNativeBridge } from './internal/native/native-bridge.js';
export type { SdkObserver, SdkOperationEvent } from './internal/observability/operation-event.js';
export type {
  SdkHttpRequest,
  SdkHttpResponse,
  SdkHttpTransport,
} from './internal/transport/http-transport.js';
export { sdkVersion } from './internal/version.js';
