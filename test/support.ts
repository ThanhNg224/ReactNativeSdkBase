import { SdkClient, type SdkClientOptions, type SdkOperationEvent } from '../src/index';
import { runnerSeamsKey } from '../src/internal/client/sdk-client';
import { FakeSdkHttpTransport, FakeSdkNativeBridge } from '../src/testing';

export const apiKey = 'test-secret-key';
export const baseUrl = 'https://api.example.test/v1/';
export const frozenNow = Date.UTC(2026, 9, 5, 9, 30, 0);

export interface Harness {
  readonly client: SdkClient;
  readonly transport: FakeSdkHttpTransport;
  readonly bridge: FakeSdkNativeBridge;
  readonly events: SdkOperationEvent[];
}

/** A client with frozen time, sequential request IDs, and fakes. */
export function createHarness(overrides: Partial<SdkClientOptions> = {}): Harness {
  const transport = new FakeSdkHttpTransport();
  const bridge = new FakeSdkNativeBridge();
  const events: SdkOperationEvent[] = [];
  let nextId = 0;
  const options = {
    config: { baseUrl, apiKey },
    transport,
    nativeBridge: bridge,
    observer: { onOperation: (event: SdkOperationEvent) => events.push(event) },
    ...overrides,
    [runnerSeamsKey]: {
      now: () => frozenNow,
      createRequestId: () => (nextId += 1).toString(16).padStart(32, '0'),
    },
  };
  return { client: new SdkClient(options), transport, bridge, events };
}

export const firstRequestId = '1'.padStart(32, '0');
