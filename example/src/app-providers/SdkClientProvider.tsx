import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SdkClient, type SdkNativeBridge } from 'react-native-sdk-base';
import type { FakeSdkHttpResponse } from 'react-native-sdk-base/testing';
import { appConfig } from '../core/config';
import { devObserver } from '../core/observability';
import { DemoSdkHttpTransport } from './demo-transport';

/** What the host can change at runtime; every change builds a new client. */
export interface SdkSettings {
  readonly baseUrl: string;
  /** Demo only: answers every request with HTTP 503. */
  readonly simulateFailure: boolean;
}

interface SdkControls {
  readonly client: SdkClient;
  readonly settings: SdkSettings;
  /** Replaces the client. Returns user-facing copy when the SDK rejects the settings. */
  readonly apply: (next: SdkSettings) => string | undefined;
}

const SdkClientContext = createContext<SdkControls | null>(null);

function useSdkControls(): SdkControls {
  const controls = useContext(SdkClientContext);
  if (controls === null) throw new Error('useSdkClient must be used inside SdkClientProvider.');
  return controls;
}

export function useSdkClient(): SdkClient {
  return useSdkControls().client;
}

/** The current settings and `apply`; `settings` changes whenever the client is replaced. */
export function useSdkSettings(): Pick<SdkControls, 'settings' | 'apply'> {
  const { settings, apply } = useSdkControls();
  return { settings, apply };
}

const unavailableFixture: FakeSdkHttpResponse = { statusCode: 503 };
const invalidBaseUrlCopy = 'Enter an absolute http(s) URL without a query or fragment.';

interface Props {
  children: ReactNode;
  /** Tests only: overrides the demo HTTP fixture. Read once, when the client is created. */
  fixture?: FakeSdkHttpResponse;
  /** Tests only: the app itself uses the real native module. */
  nativeBridge?: SdkNativeBridge;
}

/** Owns the SdkClient for the app's lifetime, replaces it on `apply`, and closes it on unmount. */
export function SdkClientProvider({ children, fixture, nativeBridge }: Props) {
  const [active, setActive] = useState<{ client: SdkClient; settings: SdkSettings } | null>(null);
  const clientRef = useRef<SdkClient | null>(null);
  const initial = useRef({ fixture, nativeBridge });

  const create = useCallback((settings: SdkSettings) => {
    return new SdkClient({
      config: { baseUrl: settings.baseUrl, apiKey: appConfig.apiKey },
      transport: new DemoSdkHttpTransport(
        settings.simulateFailure ? unavailableFixture : initial.current.fixture
      ),
      ...(initial.current.nativeBridge === undefined
        ? {}
        : { nativeBridge: initial.current.nativeBridge }),
      observer: devObserver,
    });
  }, []);

  const closeCurrent = useCallback(() => {
    const current = clientRef.current;
    clientRef.current = null;
    void current?.close();
  }, []);

  useEffect(() => {
    const settings = { baseUrl: appConfig.apiBaseUrl, simulateFailure: false };
    const created = create(settings);
    clientRef.current = created;
    setActive({ client: created, settings });
    return closeCurrent;
  }, [create, closeCurrent]);

  const apply = useCallback(
    (next: SdkSettings) => {
      let created: SdkClient;
      try {
        created = create(next);
      } catch (error) {
        if (error instanceof TypeError) return invalidBaseUrlCopy;
        throw error;
      }
      const previous = clientRef.current;
      clientRef.current = created;
      setActive({ client: created, settings: next });
      void previous?.close();
      return undefined;
    },
    [create]
  );

  const controls = useMemo(() => (active === null ? null : { ...active, apply }), [active, apply]);
  if (controls === null) return null;
  return <SdkClientContext.Provider value={controls}>{children}</SdkClientContext.Provider>;
}
