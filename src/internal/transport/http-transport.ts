/**
 * An SDK-owned HTTP request. v1 bodies are text only.
 *
 * @public
 */
export interface SdkHttpRequest {
  /** The HTTP method. */
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** The absolute request URL. */
  readonly url: string;
  /** Request headers, including authentication. */
  readonly headers: Readonly<Record<string, string>>;
  /** The request body, if any. */
  readonly body?: string;
}

/**
 * An SDK-owned HTTP response.
 *
 * @public
 */
export interface SdkHttpResponse {
  /** The HTTP status code. */
  readonly statusCode: number;
  /** Response headers with lower-cased names. */
  readonly headers: Readonly<Record<string, string>>;
  /** The response body as text. */
  readonly body: string;
}

/**
 * Sends SDK requests. The default transport uses the platform `fetch`.
 *
 * @remarks
 * A transport given to an `SdkClient` is owned by that client and must not be
 * shared between clients.
 *
 * @public
 */
export interface SdkHttpTransport {
  /**
   * Sends one request. Must reject promptly once `signal` aborts; the rejection
   * value is ignored and the SDK maps the abort itself.
   */
  send(request: SdkHttpRequest, signal: AbortSignal): Promise<SdkHttpResponse>;
  /** Called once by the owning client's `close()`. */
  close?(): Promise<void>;
}
