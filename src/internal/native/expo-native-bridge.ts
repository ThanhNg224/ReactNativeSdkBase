import type { SdkNativeBridge } from './native-bridge.js';
import { nativeUnavailableErrorCode } from '../errors/failure-tables.js';

interface ReactNativeSdkBaseModule {
  getDeviceInfoAsync(): Promise<unknown>;
}

function unavailable(cause?: unknown): Error {
  const error = new Error('The ReactNativeSdkBase native module is not available.');
  Object.defineProperty(error, 'code', { value: nativeUnavailableErrorCode });
  if (cause !== undefined) Object.defineProperty(error, 'cause', { value: cause });
  return error;
}

/**
 * The default bridge. `expo` is imported lazily on first use, so loading the
 * SDK never touches native code (Expo Go, Jest, plain Node).
 */
export function createExpoNativeBridge(): SdkNativeBridge {
  let module: Promise<ReactNativeSdkBaseModule | null> | undefined;
  const resolveModule = (): Promise<ReactNativeSdkBaseModule | null> => {
    module ??= import('expo').then((expo) =>
      expo.requireOptionalNativeModule<ReactNativeSdkBaseModule>('ReactNativeSdkBase')
    );
    return module;
  };
  return Object.freeze({
    async getDeviceInfo(): Promise<unknown> {
      let resolved: ReactNativeSdkBaseModule | null;
      try {
        resolved = await resolveModule();
      } catch (error) {
        throw unavailable(error);
      }
      if (resolved === null) throw unavailable();
      return resolved.getDeviceInfoAsync();
    },
  });
}
