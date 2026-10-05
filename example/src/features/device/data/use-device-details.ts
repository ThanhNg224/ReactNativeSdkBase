import { useQuery } from '@tanstack/react-query';
import { useSdkClient } from '../../../app-providers/SdkClientProvider';
import type { AppFailureError } from '../../../core/errors';
import type { DeviceDetails } from '../domain/device-details';
import { readDeviceDetails } from './device-repository';

export function useDeviceDetails() {
  const client = useSdkClient();
  return useQuery<DeviceDetails, AppFailureError>({
    queryKey: ['device'],
    queryFn: () => readDeviceDetails(client),
  });
}
