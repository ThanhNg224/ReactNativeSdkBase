import type { SdkDeviceInfo } from '../device/device-info.js';
import { sdkNativeUnavailableErrorCode, type SdkNativeBridge } from '../native/native-bridge.js';

type Behaviour =
  | { readonly kind: 'respond'; readonly value: unknown }
  | { readonly kind: 'fail'; readonly code: string }
  | { readonly kind: 'hang' };

/**
 * Sample device info returned by a new {@link FakeSdkNativeBridge}.
 *
 * @public
 */
export const fakeSdkDeviceInfo: SdkDeviceInfo = Object.freeze({
  platform: 'android',
  osVersion: '15',
  appId: 'com.example.host',
  appVersion: '1.0.0',
  buildNumber: '1',
});

/**
 * A deterministic `SdkNativeBridge` for tests and demos. Its behaviour
 * applies to every call until changed.
 *
 * @public
 */
export class FakeSdkNativeBridge implements SdkNativeBridge {
  private behaviour: Behaviour = { kind: 'respond', value: fakeSdkDeviceInfo };
  private calls = 0;

  /** How many times the SDK called the bridge. */
  get callCount(): number {
    return this.calls;
  }

  /** Answers with `value`, which the SDK validates; pass malformed data to test `invalid_response`. */
  respondWith(value: unknown): this {
    this.behaviour = { kind: 'respond', value };
    return this;
  }

  /** Rejects like a native coded error with `code`. */
  failWith(code = 'ERR_SDK_NATIVE'): this {
    this.behaviour = { kind: 'fail', code };
    return this;
  }

  /** Rejects as if the native module were not linked. */
  failUnavailable(): this {
    return this.failWith(sdkNativeUnavailableErrorCode);
  }

  /** Never answers. */
  hang(): this {
    this.behaviour = { kind: 'hang' };
    return this;
  }

  /** Counts the call and applies the current behaviour. */
  getDeviceInfo(): Promise<unknown> {
    this.calls += 1;
    const behaviour = this.behaviour;
    if (behaviour.kind === 'hang') return new Promise<never>(() => {});
    if (behaviour.kind === 'fail') {
      return Promise.reject(
        Object.assign(new Error('Fake native failure.'), { code: behaviour.code })
      );
    }
    return Promise.resolve(behaviour.value);
  }
}
