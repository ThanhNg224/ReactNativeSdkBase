export interface DeviceDetails {
  readonly platformLabel: 'iOS' | 'Android';
  readonly osVersion: string;
  readonly appId: string;
  /** Version and build, e.g. `1.0.0 (1)`. */
  readonly appVersionLabel: string;
}
