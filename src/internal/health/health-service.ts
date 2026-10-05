import type { SdkHealth } from './health.js';
import type { SdkOperationOptions } from '../client/operation-options.js';
import type { SdkRequestExecutor } from '../client/request-executor.js';

/**
 * Checks the backend's health endpoint.
 *
 * @public
 */
export interface SdkHealthService {
  /**
   * Performs `GET /health`.
   *
   * @throws {@link SdkError} on any expected runtime failure.
   */
  check(options?: SdkOperationOptions): Promise<SdkHealth>;
}

export function createHealthService(
  executor: SdkRequestExecutor,
  now: () => number
): SdkHealthService {
  return Object.freeze({
    check(options?: SdkOperationOptions): Promise<SdkHealth> {
      return executor.execute(
        'health.check',
        options,
        { method: 'GET', path: '/health' },
        (response) => {
          const json: unknown = JSON.parse(response.body);
          const status = (json as { status?: unknown } | null)?.status;
          if (typeof status !== 'string') {
            throw new TypeError('Health response has no string status.');
          }
          return Object.freeze({
            isHealthy: status === 'ok',
            status,
            checkedAt: new Date(now()),
          });
        }
      );
    },
  });
}
