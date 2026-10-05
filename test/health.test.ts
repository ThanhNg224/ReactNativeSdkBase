import { apiKey, createHarness, firstRequestId, frozenNow } from './support';
import { SdkClient, SdkErrorCodes, isSdkError, sdkVersion, type SdkError } from '../src/index';
import { FakeSdkHttpTransport } from '../src/testing';

async function failure(promise: Promise<unknown>): Promise<SdkError> {
  try {
    await promise;
  } catch (error) {
    if (isSdkError(error)) return error;
    throw error;
  }
  throw new Error('Expected the operation to reject.');
}

test('sends one authenticated GET with version and correlation headers', async () => {
  const { client, transport } = createHarness();
  transport.enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' });

  const health = await client.health.check();

  expect(health).toEqual({ isHealthy: true, status: 'ok', checkedAt: new Date(frozenNow) });
  expect(Object.isFrozen(health)).toBe(true);
  expect(transport.requests).toHaveLength(1);
  const [request] = transport.requests;
  expect(request?.method).toBe('GET');
  expect(request?.url).toBe('https://api.example.test/v1/health');
  expect(request?.headers).toMatchObject({
    Authorization: `Bearer ${apiKey}`,
    'X-Sdk-Version': sdkVersion,
    'X-Request-Id': firstRequestId,
  });
});

test('generates 32-character lowercase hex request IDs by default', async () => {
  const transport = new FakeSdkHttpTransport()
    .enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' })
    .enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' });
  const client = new SdkClient({
    config: { baseUrl: 'https://api.example.test', apiKey },
    transport,
  });
  await client.health.check();
  await client.health.check();
  const ids = transport.requests.map((request) => request.headers['X-Request-Id']);
  expect(ids[0]).toMatch(/^[0-9a-f]{32}$/);
  expect(ids[1]).toMatch(/^[0-9a-f]{32}$/);
  expect(ids[0]).not.toBe(ids[1]);
});

test('reports a non-ok status as unhealthy', async () => {
  const { client, transport } = createHarness();
  transport.enqueueResponse({ statusCode: 200, body: '{"status":"degraded"}' });
  await expect(client.health.check()).resolves.toMatchObject({
    isHealthy: false,
    status: 'degraded',
  });
});

test.each([
  [401, SdkErrorCodes.unauthorized, false],
  [403, SdkErrorCodes.unauthorized, false],
  [404, SdkErrorCodes.client, false],
  [422, SdkErrorCodes.client, false],
  [429, SdkErrorCodes.rateLimited, true],
  [500, SdkErrorCodes.server, true],
  [503, SdkErrorCodes.server, true],
])('maps HTTP %i to %s', async (statusCode, code, isRetryable) => {
  const { client, transport } = createHarness();
  transport.enqueueResponse({ statusCode, body: '{"error":"secret body"}' });

  const error = await failure(client.health.check());

  expect(error).toMatchObject({ code, isRetryable, statusCode, requestId: firstRequestId });
  expect(error.message).not.toContain('secret');
});

test.each([
  ['non-JSON', 'not json'],
  ['missing status', '{}'],
  ['non-string status', '{"status":1}'],
  ['null', 'null'],
])('maps a 2xx %s body to invalid_response', async (_, body) => {
  const { client, transport } = createHarness();
  transport.enqueueResponse({ statusCode: 200, body });

  const error = await failure(client.health.check());

  expect(error).toMatchObject({
    code: SdkErrorCodes.invalidResponse,
    isRetryable: false,
    statusCode: 200,
    requestId: firstRequestId,
  });
});

test('maps a transport rejection to transport and keeps the cause', async () => {
  const { client, transport } = createHarness();
  const cause = new TypeError('Network request failed');
  transport.enqueueFailure(cause);

  const error = await failure(client.health.check());

  expect(error).toMatchObject({
    code: SdkErrorCodes.transport,
    isRetryable: true,
    statusCode: undefined,
    requestId: firstRequestId,
  });
  expect(error.cause).toBe(cause);
});
