import { apiKey } from './support';
import { SdkClient } from '../src/index';
import { FakeSdkHttpTransport } from '../src/testing';

const create = (config: Record<string, unknown>) => () =>
  new SdkClient({ config: config as never, transport: new FakeSdkHttpTransport() });

test.each([
  ['relative URL', { baseUrl: '/v1', apiKey }],
  ['non-http scheme', { baseUrl: 'ftp://api.example.test', apiKey }],
  ['query string', { baseUrl: 'https://api.example.test?x=1', apiKey }],
  ['empty API key', { baseUrl: 'https://api.example.test', apiKey: '' }],
  ['zero timeout', { baseUrl: 'https://api.example.test', apiKey, requestTimeoutMs: 0 }],
  ['fractional timeout', { baseUrl: 'https://api.example.test', apiKey, requestTimeoutMs: 1.5 }],
])('rejects %s with a TypeError that never echoes the key', (_, config) => {
  expect(create(config)).toThrow(TypeError);
  try {
    create(config)();
  } catch (error) {
    expect(String(error)).not.toContain(apiKey);
  }
});

test('accepts http and https base URLs with paths', () => {
  expect(create({ baseUrl: 'http://localhost:8080', apiKey })).not.toThrow();
  expect(create({ baseUrl: 'https://api.example.test/v1/', apiKey })).not.toThrow();
});

test('keeps a copy so later mutation of the host config has no effect', async () => {
  const transport = new FakeSdkHttpTransport().enqueueResponse({
    statusCode: 200,
    body: '{"status":"ok"}',
  });
  const config = { baseUrl: 'https://one.example.test', apiKey };
  const client = new SdkClient({ config, transport });
  config.baseUrl = 'https://two.example.test';
  await client.health.check();
  expect(transport.requests[0]?.url).toBe('https://one.example.test/health');
});
