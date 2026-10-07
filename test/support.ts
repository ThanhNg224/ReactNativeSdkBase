import { SdkClient, type SdkClientOptions, type SdkOperationEvent } from '../src/index';
import { FakeSdkHttpTransport, FakeSdkNativeBridge } from '../src/testing';

// Sequential request IDs. Hoisted above the imports, so a test file must import
// this module before anything that loads the SDK; otherwise the real generator is used.
let mockNextId = 0;
jest.mock('../src/internal/util/request-id', () => ({
  createRequestId: () => (mockNextId += 1).toString(16).padStart(32, '0'),
}));

afterEach(() => jest.restoreAllMocks());

export const apiKey = 'test-secret-key';
export const baseUrl = 'https://api.example.test/v1/';
export const frozenNow = Date.UTC(2026, 9, 5, 9, 30, 0);

export interface Harness {
  readonly client: SdkClient;
  readonly transport: FakeSdkHttpTransport;
  readonly bridge: FakeSdkNativeBridge;
  readonly events: SdkOperationEvent[];
}

/** A client with frozen time, request IDs restarting at 1, and fakes. */
export function createHarness(overrides: Partial<SdkClientOptions> = {}): Harness {
  const transport = new FakeSdkHttpTransport();
  const bridge = new FakeSdkNativeBridge();
  const events: SdkOperationEvent[] = [];
  mockNextId = 0;
  jest.spyOn(Date, 'now').mockReturnValue(frozenNow);
  const options = {
    config: { baseUrl, apiKey },
    transport,
    nativeBridge: bridge,
    observer: { onOperation: (event: SdkOperationEvent) => events.push(event) },
    ...overrides,
  };
  return { client: new SdkClient(options), transport, bridge, events };
}

export const firstRequestId = '1'.padStart(32, '0');
