import { useQuery } from '@tanstack/react-query';
import { useSdkClient, useSdkSettings } from '../../app-providers/SdkClientProvider';
import type { AppFailureError } from '../../core/errors';
import { checkHealth, type HealthStatus } from './check-health';

export function useHealthCheck() {
  const client = useSdkClient();
  const { settings } = useSdkSettings();
  // The key follows the settings so a replaced client refetches instead of reusing old data.
  return useQuery<HealthStatus, AppFailureError>({
    queryKey: ['health', settings.baseUrl, settings.simulateFailure],
    queryFn: () => checkHealth(client),
  });
}
