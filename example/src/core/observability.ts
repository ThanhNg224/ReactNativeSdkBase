import type { SdkObserver } from 'react-native-sdk-base';

/** Logs the SDK's safe terminal event in development builds only. */
export const devObserver: SdkObserver = {
  onOperation(event) {
    if (__DEV__) console.debug('[sdk]', event);
  },
};
