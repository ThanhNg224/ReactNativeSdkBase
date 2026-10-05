import { createHarness, firstRequestId } from './support';
import { SdkClient, SdkErrorCodes } from '../src/index';
import { FakeSdkHttpTransport, fakeSdkDeviceInfo } from '../src/testing';

test('returns validated, frozen device info and one event', async () => {
  const { client, bridge, events } = createHarness();

  const info = await client.device.getInfo();

  expect(info).toEqual(fakeSdkDeviceInfo);
  expect(Object.isFrozen(info)).toBe(true);
  expect(bridge.callCount).toBe(1);
  expect(events).toEqual([
    expect.objectContaining({ operation: 'device.getInfo', outcome: 'succeeded' }),
  ]);
  expect(events[0]).not.toHaveProperty('statusCode');
});

test('maps a missing native module to native_unavailable', async () => {
  const { client, bridge } = createHarness();
  bridge.failUnavailable();
  await expect(client.device.getInfo()).rejects.toMatchObject({
    code: SdkErrorCodes.nativeUnavailable,
    isRetryable: false,
    requestId: firstRequestId,
  });
});

test('maps any other native rejection to native', async () => {
  const { client, bridge } = createHarness();
  bridge.failWith('ERR_SDK_SOMETHING');
  await expect(client.device.getInfo()).rejects.toMatchObject({
    code: SdkErrorCodes.native,
    isRetryable: false,
    requestId: firstRequestId,
  });
});

test.each([
  ['null', null],
  ['unknown platform', { ...fakeSdkDeviceInfo, platform: 'web' }],
  ['missing field', { ...fakeSdkDeviceInfo, appId: undefined }],
  ['non-string field', { ...fakeSdkDeviceInfo, buildNumber: 7 }],
])('maps a malformed native result (%s) to invalid_response', async (_, value) => {
  const { client, bridge } = createHarness();
  bridge.respondWith(value);
  await expect(client.device.getInfo()).rejects.toMatchObject({
    code: SdkErrorCodes.invalidResponse,
    requestId: firstRequestId,
  });
});

test('times out a native call that never answers', async () => {
  const { client, bridge } = createHarness({
    config: { baseUrl: 'https://api.example.test', apiKey: 'k', requestTimeoutMs: 20 },
  });
  bridge.hang();
  await expect(client.device.getInfo()).rejects.toMatchObject({ code: SdkErrorCodes.timeout });
});

test('the default bridge loads without native code and reports native_unavailable', async () => {
  const client = new SdkClient({
    config: { baseUrl: 'https://api.example.test', apiKey: 'k' },
    transport: new FakeSdkHttpTransport(),
  });
  await expect(client.device.getInfo()).rejects.toMatchObject({
    code: SdkErrorCodes.nativeUnavailable,
  });
});
