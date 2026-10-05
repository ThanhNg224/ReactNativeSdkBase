import type { SdkDeviceInfo } from './device-info.js';
import type { SdkOperationOptions } from '../client/operation-options.js';
import type { SdkOperationRunner } from '../client/operation-runner.js';
import { invalidResponse, nativeFailure } from '../errors/failure-tables.js';
import type { SdkNativeBridge } from '../native/native-bridge.js';

/**
 * Reads device and app metadata through the SDK's native module.
 *
 * @public
 */
export interface SdkDeviceService {
  /**
   * Reads {@link SdkDeviceInfo}. Rejects with code `native_unavailable` when the
   * native module is not linked (for example in Expo Go).
   *
   * @throws {@link SdkError} on any expected runtime failure.
   */
  getInfo(options?: SdkOperationOptions): Promise<SdkDeviceInfo>;
}

const stringFields = ['osVersion', 'appId', 'appVersion', 'buildNumber'] as const;

function decodeDeviceInfo(raw: unknown): SdkDeviceInfo {
  if (typeof raw !== 'object' || raw === null) {
    throw new TypeError('Device info is not an object.');
  }
  const record = raw as Record<string, unknown>;
  const platform = record['platform'];
  if (platform !== 'ios' && platform !== 'android') {
    throw new TypeError('Device info has an unknown platform.');
  }
  for (const field of stringFields) {
    if (typeof record[field] !== 'string') {
      throw new TypeError(`Device info field ${field} is not a string.`);
    }
  }
  return Object.freeze({
    platform,
    osVersion: record['osVersion'] as string,
    appId: record['appId'] as string,
    appVersion: record['appVersion'] as string,
    buildNumber: record['buildNumber'] as string,
  });
}

export function createDeviceService(
  runner: SdkOperationRunner,
  bridge: SdkNativeBridge
): SdkDeviceService {
  return Object.freeze({
    getInfo(options?: SdkOperationOptions): Promise<SdkDeviceInfo> {
      return runner.run(
        'device.getInfo',
        options,
        async (context) => {
          let raw: unknown;
          try {
            raw = await bridge.getDeviceInfo();
          } catch (error) {
            throw nativeFailure(error, context.requestId);
          }
          try {
            return decodeDeviceInfo(raw);
          } catch (error) {
            throw invalidResponse(context.requestId, error);
          }
        },
        nativeFailure
      );
    },
  });
}
