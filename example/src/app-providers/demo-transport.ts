import type { SdkHttpRequest, SdkHttpResponse, SdkHttpTransport } from 'react-native-sdk-base';
import { FakeSdkHttpTransport, type FakeSdkHttpResponse } from 'react-native-sdk-base/testing';

export const defaultFixture: FakeSdkHttpResponse = { statusCode: 200, body: '{"status":"ok"}' };

/** Host-only demo transport: answers every request with one fixture. */
export class DemoSdkHttpTransport implements SdkHttpTransport {
  private readonly fake: FakeSdkHttpTransport;

  constructor(fixture: FakeSdkHttpResponse = defaultFixture) {
    this.fake = new FakeSdkHttpTransport().setHandler(() => fixture);
  }

  send(request: SdkHttpRequest, signal: AbortSignal): Promise<SdkHttpResponse> {
    return this.fake.send(request, signal);
  }

  close(): Promise<void> {
    return this.fake.close();
  }
}
