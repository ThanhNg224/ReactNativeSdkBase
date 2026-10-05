/**
 * Per-operation options.
 *
 * @public
 */
export interface SdkOperationOptions {
  /**
   * Aborts the operation, which then rejects with code `cancelled`.
   *
   * @remarks
   * Best-effort: the SDK stops waiting, but the server may still have received
   * and processed the request, and native work is not interrupted. Aborting
   * never closes the client.
   */
  readonly signal?: AbortSignal;
}
