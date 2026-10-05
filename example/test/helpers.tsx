import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SdkClient, type SdkNativeBridge } from 'react-native-sdk-base';
import { FakeSdkHttpTransport, type FakeSdkHttpResponse } from 'react-native-sdk-base/testing';
import { SdkClientProvider } from '../src/app-providers/SdkClientProvider';

export function makeClient(
  options: { transport?: FakeSdkHttpTransport; nativeBridge?: SdkNativeBridge } = {}
): SdkClient {
  return new SdkClient({
    config: { baseUrl: 'https://api.example.test', apiKey: 'test-key' },
    transport: options.transport ?? new FakeSdkHttpTransport(),
    ...(options.nativeBridge === undefined ? {} : { nativeBridge: options.nativeBridge }),
  });
}

export async function renderWithProviders(
  ui: ReactElement,
  options: { fixture?: FakeSdkHttpResponse; nativeBridge?: SdkNativeBridge } = {}
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return await render(
    <SdkClientProvider {...options}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SdkClientProvider>
  );
}
