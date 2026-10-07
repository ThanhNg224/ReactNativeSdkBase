import { invalidResponse, nativeFailure } from '../errors/failure-tables.js';
import type { SdkNativeBridge } from '../native/native-bridge.js';
import type { SdkOperationOptions } from './operation-options.js';
import type { SdkOperationRunner } from './operation-runner.js';

/**
 * The native specialisation of the runner: the native failure table and
 * invalid-result mapping, mirroring `SdkRequestExecutor` for HTTP.
 */
export class SdkNativeExecutor {
  constructor(
    private readonly runner: SdkOperationRunner,
    private readonly bridge: SdkNativeBridge
  ) {}

  /** Runs `call` against the bridge and decodes its result with `decode`, which throws on bad input. */
  execute<T>(
    operation: string,
    options: SdkOperationOptions | undefined,
    call: (bridge: SdkNativeBridge) => Promise<unknown>,
    decode: (raw: unknown) => T
  ): Promise<T> {
    return this.runner.run(
      operation,
      options,
      async (context) => {
        let raw: unknown;
        try {
          raw = await call(this.bridge);
        } catch (error) {
          throw nativeFailure(error, context.requestId);
        }
        try {
          return decode(raw);
        } catch (error) {
          throw invalidResponse(context.requestId, error);
        }
      },
      nativeFailure
    );
  }
}
