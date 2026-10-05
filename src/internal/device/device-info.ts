/**
 * Platform and app metadata read by the SDK's native module.
 *
 * @public
 */
export interface SdkDeviceInfo {
  /** The running platform. */
  readonly platform: 'ios' | 'android';
  /** The OS version string, for example `'17.5'` or `'14'`. */
  readonly osVersion: string;
  /** iOS bundle identifier or Android `applicationId`. */
  readonly appId: string;
  /** `CFBundleShortVersionString` or Android `versionName`. */
  readonly appVersion: string;
  /** `CFBundleVersion` or Android `versionCode`. */
  readonly buildNumber: string;
}
