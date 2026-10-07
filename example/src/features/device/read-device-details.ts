import type { SdkClient } from 'react-native-sdk-base';
import { toAppFailureError } from '../../core/errors';

export interface DeviceDetails {
  readonly platformLabel: 'iOS' | 'Android';
  readonly osVersion: string;
  readonly appId: string;
  /** Version and build, e.g. `1.0.0 (1)`. */
  readonly appVersionLabel: string;
}

export async function readDeviceDetails(client: SdkClient): Promise<DeviceDetails> {
  try {
    const info = await client.device.getInfo();
    return {
      platformLabel: info.platform === 'ios' ? 'iOS' : 'Android',
      osVersion: info.osVersion,
      appId: info.appId,
      appVersionLabel: `${info.appVersion} (${info.buildNumber})`,
    };
  } catch (error) {
    throw toAppFailureError(error);
  }
}
