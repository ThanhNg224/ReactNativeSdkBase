/**
 * The native error `code` a bridge rejects with when the native module is not
 * linked into the running app. The SDK maps it to `native_unavailable`; any
 * other rejection maps to `native`.
 *
 * @public
 */
export const sdkNativeUnavailableErrorCode = 'ERR_SDK_NATIVE_UNAVAILABLE';

/**
 * The SDK's boundary to its native module.
 *
 * @remarks
 * Methods return `unknown`; the SDK validates every native result. A bridge
 * signals a missing native module by rejecting with an error whose `code` is
 * {@link sdkNativeUnavailableErrorCode}.
 *
 * Each native capability adds a method here, so a hand-written bridge breaks
 * whenever one is added (recorded in `CHANGELOG.md`). In tests, use or extend
 * `FakeSdkNativeBridge` from `react-native-sdk-base/testing` instead.
 *
 * @public
 */
export interface SdkNativeBridge {
  /** Reads platform and app metadata from the native module. */
  getDeviceInfo(): Promise<unknown>;
}
