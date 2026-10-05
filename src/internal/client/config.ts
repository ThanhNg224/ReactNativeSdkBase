/**
 * Configuration for an {@link SdkClient}.
 *
 * @public
 */
export interface SdkConfig {
  /** Absolute `http:` or `https:` base URL. A trailing slash is optional. */
  readonly baseUrl: string;
  /** Sent as `Authorization: Bearer <apiKey>`. Never included in events or error text. */
  readonly apiKey: string;
  /** Per-operation timeout in milliseconds. Defaults to 15000. Must be a positive integer. */
  readonly requestTimeoutMs?: number;
}

/** The validated, frozen form of {@link SdkConfig} the client keeps. */
export interface NormalizedSdkConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly requestTimeoutMs: number;
}

const defaultRequestTimeoutMs = 15_000;
const absoluteHttpUrl = /^https?:\/\/[^/?#\s]+(?:\/[^?#\s]*)?$/i;

/** Validates `config` once. Messages never echo the URL or the key. */
export function normalizeConfig(config: SdkConfig): NormalizedSdkConfig {
  if (typeof config.baseUrl !== 'string' || !absoluteHttpUrl.test(config.baseUrl)) {
    throw new TypeError(
      'SdkConfig.baseUrl must be an absolute http(s) URL without query or fragment.'
    );
  }
  if (typeof config.apiKey !== 'string' || config.apiKey.length === 0) {
    throw new TypeError('SdkConfig.apiKey must be a non-empty string.');
  }
  const requestTimeoutMs = config.requestTimeoutMs ?? defaultRequestTimeoutMs;
  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new TypeError('SdkConfig.requestTimeoutMs must be a positive integer.');
  }
  return Object.freeze({
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
    apiKey: config.apiKey,
    requestTimeoutMs,
  });
}
