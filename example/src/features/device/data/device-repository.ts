import type { SdkClient } from 'react-native-sdk-base';
import { toAppFailureError } from '../../../core/errors';
import type { DeviceDetails } from '../domain/device-details';

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
