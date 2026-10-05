# Changelog

## 0.1.0 (unreleased)

- Scaffolded the package as a standalone Expo module (iOS and Android) with
  `react-native-sdk-base` and `react-native-sdk-base/testing` entry points,
  shipped as ES modules.
- Declared support floors derived from Expo SDK 57: React Native 0.86,
  React 19.2, Android API 24, iOS 16.4, Node.js 22.13.
- Initial public API: `SdkClient`, `SdkClientOptions`, `SdkConfig`,
  `SdkOperationOptions`, `SdkHealthService`, `SdkHealth`, `SdkDeviceService`,
  `SdkDeviceInfo`, and `sdkVersion`.
- One operation path for HTTP and native capabilities: timeout, best-effort
  cancellation through `AbortSignal`, client close, and per-operation
  `X-Request-Id` / `X-Sdk-Version` headers with `Authorization: Bearer`.
- Typed failures via `SdkError`, `isSdkError`, and `SdkErrorCodes`
  (`cancelled`, `timeout`, `transport`, `unauthorized`, `client`,
  `rate_limited`, `server`, `invalid_response`, `native_unavailable`,
  `native`).
- Silent-by-default `SdkObserver` with one safe `SdkOperationEvent` per
  operation.
- Injectable `SdkHttpTransport` (default: platform `fetch`) and
  `SdkNativeBridge` (default: the Expo module, loaded lazily).
- Native `getDeviceInfoAsync` on iOS (Swift) and Android (Kotlin).
- `FakeSdkHttpTransport`, `FakeSdkNativeBridge`, and `fakeSdkDeviceInfo` in
  `react-native-sdk-base/testing`.
