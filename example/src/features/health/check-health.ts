import type { SdkClient } from 'react-native-sdk-base';
import { toAppFailureError } from '../../core/errors';

export interface HealthStatus {
  readonly isHealthy: boolean;
  readonly statusText: string;
  readonly checkedAt: Date;
}

export async function checkHealth(client: SdkClient): Promise<HealthStatus> {
  try {
    const health = await client.health.check();
    return {
      isHealthy: health.isHealthy,
      statusText: health.status,
      checkedAt: health.checkedAt,
    };
  } catch (error) {
    throw toAppFailureError(error);
  }
}
