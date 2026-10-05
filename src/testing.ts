/**
 * Supported test doubles for hosts integrating `react-native-sdk-base`.
 *
 * Import this from tests and from example code only.
 *
 * @packageDocumentation
 */

export { FakeSdkHttpTransport } from './internal/testing/fake-http-transport.js';
export type {
  FakeSdkHttpHandler,
  FakeSdkHttpResponse,
} from './internal/testing/fake-http-transport.js';
export { FakeSdkNativeBridge, fakeSdkDeviceInfo } from './internal/testing/fake-native-bridge.js';
