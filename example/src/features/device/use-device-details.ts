import { useQuery } from '@tanstack/react-query';
import { useSdkClient } from '../../app-providers/SdkClientProvider';
import type { AppFailureError } from '../../core/errors';
import { readDeviceDetails, type DeviceDetails } from './read-device-details';

export function useDeviceDetails() {
  const client = useSdkClient();
  return useQuery<DeviceDetails, AppFailureError>({
    queryKey: ['device'],
    queryFn: () => readDeviceDetails(client),
  });
}
