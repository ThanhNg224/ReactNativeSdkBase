import { useQuery } from '@tanstack/react-query';
import { useSdkClient } from '../../app-providers/SdkClientProvider';
import type { AppFailureError } from '../../core/errors';
import { checkHealth, type HealthStatus } from './check-health';

export function useHealthCheck() {
  const client = useSdkClient();
  return useQuery<HealthStatus, AppFailureError>({
    queryKey: ['health'],
    queryFn: () => checkHealth(client),
  });
}
