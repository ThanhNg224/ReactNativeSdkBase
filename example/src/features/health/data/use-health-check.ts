import { useQuery } from '@tanstack/react-query';
import { useSdkClient } from '../../../app-providers/SdkClientProvider';
import type { AppFailureError } from '../../../core/errors';
import type { HealthStatus } from '../domain/health-status';
import { checkHealth } from './health-repository';

export function useHealthCheck() {
  const client = useSdkClient();
  return useQuery<HealthStatus, AppFailureError>({
    queryKey: ['health'],
    queryFn: () => checkHealth(client),
  });
}
