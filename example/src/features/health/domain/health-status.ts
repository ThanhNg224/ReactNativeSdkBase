export interface HealthStatus {
  readonly isHealthy: boolean;
  readonly statusText: string;
  readonly checkedAt: Date;
}
