import { SdkErrorCodes } from '../errors/error-codes.js';
import { failureForStatus, invalidResponse } from '../errors/failure-tables.js';
import { SdkError } from '../errors/sdk-error.js';
import type {
  SdkHttpRequest,
  SdkHttpResponse,
  SdkHttpTransport,
} from '../transport/http-transport.js';
import { joinUrl } from '../util/join-url.js';
import { sdkVersion } from '../version.js';
import type { NormalizedSdkConfig } from './config.js';
import type { SdkOperationOptions } from './operation-options.js';
import type { SdkOperationRunner } from './operation-runner.js';

/** What a capability asks the executor to send. */
export interface HttpCall {
  readonly method: SdkHttpRequest['method'];
  readonly path: string;
  readonly body?: string;
}

/**
 * The HTTP specialisation of the runner: authentication, version and
 * correlation headers, the status table, and invalid-body mapping.
 */
export class SdkRequestExecutor {
  constructor(
    private readonly runner: SdkOperationRunner,
    private readonly transport: SdkHttpTransport,
    private readonly config: NormalizedSdkConfig
  ) {}

  /** Sends `call` and decodes a 2xx response with `decode`, which throws on bad input. */
  execute<T>(
    operation: string,
    options: SdkOperationOptions | undefined,
    call: HttpCall,
    decode: (response: SdkHttpResponse, requestId: string) => T
  ): Promise<T> {
    return this.runner.run(
      operation,
      options,
      async (context) => {
        const request: SdkHttpRequest = {
          method: call.method,
          url: joinUrl(this.config.baseUrl, call.path),
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
            'X-Request-Id': context.requestId,
            'X-Sdk-Version': sdkVersion,
            ...(call.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          ...(call.body === undefined ? {} : { body: call.body }),
        };
        const response = await this.transport.send(request, context.signal);
        context.statusCode = response.statusCode;
        if (response.statusCode < 200 || response.statusCode > 299) {
          const advice = failureForStatus(response.statusCode);
          throw new SdkError({
            ...advice,
            message: `The server answered HTTP ${response.statusCode}.`,
            statusCode: response.statusCode,
            requestId: context.requestId,
          });
        }
        try {
          return decode(response, context.requestId);
        } catch (error) {
          throw invalidResponse(context.requestId, error, response.statusCode);
        }
      },
      (error, requestId) =>
        new SdkError({
          code: SdkErrorCodes.transport,
          message: 'The HTTP request failed before a response was received.',
          isRetryable: true,
          requestId,
          cause: error,
        })
    );
  }
}
