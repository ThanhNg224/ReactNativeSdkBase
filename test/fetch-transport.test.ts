import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { SdkClient, SdkErrorCodes, sdkVersion } from '../src/index';

let server: Server;
let baseUrl: string;
let lastHeaders: IncomingHttpHeaders = {};
let lastPath = '';

beforeAll(async () => {
  server = createServer((request, response) => {
    lastHeaders = request.headers;
    lastPath = request.url ?? '';
    if (request.url === '/v1/hang/health') return;
    const status = request.url === '/v1/down/health' ? 503 : 200;
    response.writeHead(status, { 'Content-Type': 'application/json', 'X-Trace': 'abc' });
    response.end(status === 200 ? '{"status":"ok"}' : '{"error":"down"}');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('the default fetch transport sends SDK headers on the wire', async () => {
  const client = new SdkClient({ config: { baseUrl, apiKey: 'wire-key' } });

  await expect(client.health.check()).resolves.toMatchObject({ isHealthy: true, status: 'ok' });

  expect(lastPath).toBe('/v1/health');
  expect(lastHeaders['authorization']).toBe('Bearer wire-key');
  expect(lastHeaders['x-sdk-version']).toBe(sdkVersion);
  expect(lastHeaders['x-request-id']).toMatch(/^[0-9a-f]{32}$/);
  await client.close();
});

test('the default fetch transport surfaces HTTP status through the status table', async () => {
  const client = new SdkClient({ config: { baseUrl: `${baseUrl}/down`, apiKey: 'k' } });
  await expect(client.health.check()).rejects.toMatchObject({
    code: SdkErrorCodes.server,
    statusCode: 503,
  });
});

test('the default fetch transport aborts on timeout', async () => {
  const client = new SdkClient({
    config: { baseUrl: `${baseUrl}/hang`, apiKey: 'k', requestTimeoutMs: 50 },
  });
  await expect(client.health.check()).rejects.toMatchObject({ code: SdkErrorCodes.timeout });
});

test('an unreachable host maps to transport', async () => {
  const client = new SdkClient({ config: { baseUrl: 'http://127.0.0.1:9', apiKey: 'k' } });
  await expect(client.health.check()).rejects.toMatchObject({ code: SdkErrorCodes.transport });
});
