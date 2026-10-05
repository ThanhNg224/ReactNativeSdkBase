/**
 * The result of {@link SdkHealthService.check}.
 *
 * @public
 */
export interface SdkHealth {
  /** Whether the service reported `status: "ok"`. */
  readonly isHealthy: boolean;
  /** The status string the service reported. */
  readonly status: string;
  /** When the SDK observed the response. */
  readonly checkedAt: Date;
}
