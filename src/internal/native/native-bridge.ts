/**
 * The SDK's boundary to its native module. Inject a fake in tests.
 *
 * @remarks
 * Methods return `unknown`; the SDK validates every native result. A bridge
 * signals that the native module is missing by rejecting with an error whose
 * `code` is `'ERR_SDK_NATIVE_UNAVAILABLE'`.
 *
 * @public
 */
export interface SdkNativeBridge {
  /** Reads platform and app metadata from the native module. */
  getDeviceInfo(): Promise<unknown>;
}
