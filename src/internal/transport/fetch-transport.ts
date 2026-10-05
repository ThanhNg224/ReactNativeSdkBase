import type { SdkHttpRequest, SdkHttpResponse, SdkHttpTransport } from './http-transport.js';

/** The default transport, backed by the global `fetch`. */
export function createFetchTransport(): SdkHttpTransport {
  return {
    async send(request: SdkHttpRequest, signal: AbortSignal): Promise<SdkHttpResponse> {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        ...(request.body === undefined ? {} : { body: request.body }),
        signal,
      });
      const headers: Record<string, string> = {};
      response.headers.forEach((value, name) => {
        headers[name.toLowerCase()] = value;
      });
      return { statusCode: response.status, headers, body: await response.text() };
    },
  };
}
