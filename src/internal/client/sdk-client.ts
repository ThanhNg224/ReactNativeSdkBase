import { normalizeConfig, type SdkConfig } from './config.js';
import { SdkNativeExecutor } from './native-executor.js';
import { SdkOperationRunner, type RunnerSeams } from './operation-runner.js';
import { SdkRequestExecutor } from './request-executor.js';
import { createDeviceService, type SdkDeviceService } from '../device/device-service.js';
import { createHealthService, type SdkHealthService } from '../health/health-service.js';
import { createExpoNativeBridge } from '../native/expo-native-bridge.js';
import type { SdkNativeBridge } from '../native/native-bridge.js';
import type { SdkObserver } from '../observability/operation-event.js';
import { createFetchTransport } from '../transport/fetch-transport.js';
import type { SdkHttpTransport } from '../transport/http-transport.js';
import { createRequestId } from '../util/request-id.js';

/**
 * Options for constructing an {@link SdkClient}.
 *
 * @public
 */
export interface SdkClientOptions {
  /** Validated once at construction. */
  readonly config: SdkConfig;
  /** Defaults to the platform `fetch`. Owned by the client from this point on; closed by `close()`. */
  readonly transport?: SdkHttpTransport;
  /** Defaults to the package's Expo native module. */
  readonly nativeBridge?: SdkNativeBridge;
  /** Receives one event per operation. Defaults to none. */
  readonly observer?: SdkObserver;
}

/** Internal-only option key; package tests use it to freeze time and IDs. */
export const runnerSeamsKey = Symbol('react-native-sdk-base.runnerSeams');

interface InternalClientOptions extends SdkClientOptions {
  readonly [runnerSeamsKey]?: RunnerSeams;
}

/**
 * The SDK entry point. Create one per configuration; several may run side by side.
 *
 * @public
 */
export class SdkClient {
  /** The reference HTTP capability. */
  readonly health: SdkHealthService;
  /** The reference native capability. */
  readonly device: SdkDeviceService;

  private readonly runner: SdkOperationRunner;
  private readonly transport: SdkHttpTransport;
  private closing: Promise<void> | undefined;

  /**
   * @throws `TypeError` when `options.config` is invalid (a host programming mistake).
   */
  constructor(options: SdkClientOptions) {
    const config = normalizeConfig(options.config);
    const seams = (options as InternalClientOptions)[runnerSeamsKey] ?? {
      now: Date.now,
      createRequestId,
    };
    this.transport = options.transport ?? createFetchTransport();
    this.runner = new SdkOperationRunner(config.requestTimeoutMs, options.observer, seams);
    const executor = new SdkRequestExecutor(this.runner, this.transport, config);
    this.health = createHealthService(executor, seams.now);
    this.device = createDeviceService(
      new SdkNativeExecutor(this.runner, options.nativeBridge ?? createExpoNativeBridge())
    );
  }

  /**
   * Rejects new operations, cancels in-flight ones (they reject with code
   * `cancelled`), waits for them to settle, then closes the owned transport.
   * Idempotent.
   */
  close(): Promise<void> {
    this.closing ??= this.runner.close().then(() => this.transport.close?.());
    return this.closing;
  }
}
