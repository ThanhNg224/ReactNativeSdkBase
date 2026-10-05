import type { SdkClient } from 'react-native-sdk-base';
import { toAppFailureError } from '../../../core/errors';
import type { HealthStatus } from '../domain/health-status';

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
