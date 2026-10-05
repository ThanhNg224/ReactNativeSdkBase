import { createHarness, firstRequestId } from './support';
import { SdkErrorCodes, isSdkError } from '../src/index';

const ok = { statusCode: 200, body: '{"status":"ok"}' };

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (isSdkError(error)) return error.code;
    throw error;
  }
  return 'resolved';
}

test('times out a hung request and aborts the transport signal', async () => {
  const { client, transport } = createHarness({
    config: { baseUrl: 'https://api.example.test', apiKey: 'k', requestTimeoutMs: 20 },
  });
  transport.enqueueHang();

  await expect(client.health.check()).rejects.toMatchObject({
    code: SdkErrorCodes.timeout,
    isRetryable: true,
    requestId: firstRequestId,
  });
});

test('cancels through the host signal without closing the client', async () => {
  const { client, transport } = createHarness();
  transport.enqueueHang().enqueueResponse(ok);
  const controller = new AbortController();

  const pending = client.health.check({ signal: controller.signal });
  controller.abort();

  await expect(pending).rejects.toMatchObject({
    code: SdkErrorCodes.cancelled,
    isRetryable: false,
  });
  await expect(client.health.check()).resolves.toMatchObject({ isHealthy: true });
});

test('a pre-aborted signal never opens a transport call', async () => {
  const { client, transport, events } = createHarness();
  const controller = new AbortController();
  controller.abort();

  expect(await codeOf(client.health.check({ signal: controller.signal }))).toBe('cancelled');
  expect(transport.requests).toHaveLength(0);
  expect(events).toHaveLength(1);
});

test('one signal deliberately groups operations', async () => {
  const { client, transport } = createHarness();
  transport.enqueueHang().enqueueHang();
  const controller = new AbortController();

  const first = codeOf(client.health.check({ signal: controller.signal }));
  const second = codeOf(client.health.check({ signal: controller.signal }));
  controller.abort();

  expect(await Promise.all([first, second])).toEqual(['cancelled', 'cancelled']);
});

test('close cancels in-flight work, closes the transport once, and rejects later calls', async () => {
  const { client, transport, bridge } = createHarness();
  transport.enqueueHang();
  bridge.hang();

  const http = codeOf(client.health.check());
  const native = codeOf(client.device.getInfo());
  await Promise.all([client.close(), client.close()]);

  expect(await http).toBe('cancelled');
  expect(await native).toBe('cancelled');
  expect(transport.closeCalls).toBe(1);
  await expect(client.health.check()).rejects.toThrow('SdkClient is closed.');
  await expect(client.health.check()).rejects.not.toHaveProperty('code');
});

test('two clients with different configs do not interfere', async () => {
  const a = createHarness({ config: { baseUrl: 'https://a.example.test', apiKey: 'key-a' } });
  const b = createHarness({ config: { baseUrl: 'https://b.example.test', apiKey: 'key-b' } });
  a.transport.enqueueHang();
  b.transport.enqueueResponse(ok);

  const pendingA = codeOf(a.client.health.check());
  await b.client.health.check();
  await a.client.close();

  expect(await pendingA).toBe('cancelled');
  expect(b.transport.requests[0]?.url).toBe('https://b.example.test/health');
  expect(b.transport.requests[0]?.headers['Authorization']).toBe('Bearer key-b');
  b.transport.enqueueResponse(ok);
  await expect(b.client.health.check()).resolves.toMatchObject({ isHealthy: true });
});
