import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SdkClient, type SdkNativeBridge } from 'react-native-sdk-base';
import type { FakeSdkHttpResponse } from 'react-native-sdk-base/testing';
import { appConfig } from '../core/config';
import { devObserver } from '../core/observability';
import { DemoSdkHttpTransport } from './demo-transport';

const SdkClientContext = createContext<SdkClient | null>(null);

export function useSdkClient(): SdkClient {
  const client = useContext(SdkClientContext);
  if (client === null) throw new Error('useSdkClient must be used inside SdkClientProvider.');
  return client;
}

interface Props {
  children: ReactNode;
  /** Tests only: overrides the demo HTTP fixture. Read once, when the client is created. */
  fixture?: FakeSdkHttpResponse;
  /** Tests only: the app itself uses the real native module. */
  nativeBridge?: SdkNativeBridge;
}

/** Owns one SdkClient for the app's lifetime and closes it on unmount. */
export function SdkClientProvider({ children, fixture, nativeBridge }: Props) {
  const [client, setClient] = useState<SdkClient | null>(null);

  useEffect(() => {
    const created = new SdkClient({
      config: { baseUrl: appConfig.apiBaseUrl, apiKey: appConfig.apiKey },
      transport: new DemoSdkHttpTransport(fixture),
      ...(nativeBridge === undefined ? {} : { nativeBridge }),
      observer: devObserver,
    });
    setClient(created);
    return () => {
      void created.close();
    };
    // The client is created once per mount; later prop changes are ignored.
  }, []);

  if (client === null) return null;
  return <SdkClientContext.Provider value={client}>{children}</SdkClientContext.Provider>;
}
