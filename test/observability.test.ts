import { apiKey, createHarness, firstRequestId } from './support';
import { SdkClient, SdkErrorCodes, sdkVersion } from '../src/index';
import { FakeSdkHttpTransport } from '../src/testing';

test('emits exactly one success event without failure fields', async () => {
  const { client, transport, events } = createHarness();
  transport.enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' });

  await client.health.check();

  expect(events).toEqual([
    {
      operation: 'health.check',
      requestId: firstRequestId,
      sdkVersion,
      outcome: 'succeeded',
      elapsedMs: 0,
      statusCode: 200,
    },
  ]);
});

test('emits exactly one failure event with code and retry advice', async () => {
  const { client, transport, events } = createHarness();
  transport.enqueueResponse({ statusCode: 503, body: 'down' });

  await client.health.check().catch(() => {});

  expect(events).toEqual([
    expect.objectContaining({
      outcome: 'failed',
      statusCode: 503,
      failureCode: SdkErrorCodes.server,
      isRetryable: true,
    }),
  ]);
});

test('events and errors never contain the key, URL, or body', async () => {
  const { client, transport, events } = createHarness();
  transport.enqueueResponse({ statusCode: 500, body: 'private-body' });
  transport.enqueueFailure(new Error(`failed https://api.example.test/v1/health ${apiKey}`));

  const errors = [
    await client.health.check().catch((error: unknown) => error),
    await client.health.check().catch((error: unknown) => error),
  ];

  const serialised = JSON.stringify([events, errors, errors.map(String)]);
  for (const secret of [apiKey, 'api.example.test', '/health', 'private-body']) {
    expect(serialised).not.toContain(secret);
  }
  expect(events).toHaveLength(2);
});

test('observer exceptions and rejections never affect the operation', async () => {
  const unhandled = jest.fn();
  process.on('unhandledRejection', unhandled);
  const throwing = createHarness({
    observer: {
      onOperation: () => {
        throw new Error('boom');
      },
    },
  });
  const rejecting = createHarness({
    observer: { onOperation: () => Promise.reject(new Error('boom')) as unknown as void },
  });
  throwing.transport.enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' });
  rejecting.transport.enqueueResponse({ statusCode: 200, body: '{"status":"ok"}' });

  await expect(throwing.client.health.check()).resolves.toMatchObject({ isHealthy: true });
  await expect(rejecting.client.health.check()).resolves.toMatchObject({ isHealthy: true });
  await new Promise((resolve) => setImmediate(resolve));
  process.off('unhandledRejection', unhandled);
  expect(unhandled).not.toHaveBeenCalled();
});

test('a client without an observer runs silently', async () => {
  const transport = new FakeSdkHttpTransport().enqueueResponse({
    statusCode: 200,
    body: '{"status":"ok"}',
  });
  const client = new SdkClient({
    config: { baseUrl: 'https://api.example.test', apiKey },
    transport,
  });
  await expect(client.health.check()).resolves.toMatchObject({ isHealthy: true });
});
