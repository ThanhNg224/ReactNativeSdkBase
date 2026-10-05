/** Why an operation stopped before its work settled. */
export type AbortReason = 'timeout' | 'cancelled';

/**
 * The abort machinery of one operation: an internal controller linked to the
 * host signal and the timeout, and a promise that rejects the moment either
 * fires. The first reason wins.
 */
export class OperationLifetime {
  private readonly controller = new AbortController();
  private readonly timer: ReturnType<typeof setTimeout>;
  private readonly aborted: Promise<never>;
  private rejectAborted: (reason: AbortReason) => void = () => {};
  private abortReason: AbortReason | undefined;
  private readonly onHostAbort = (): void => this.abort('cancelled');

  constructor(
    timeoutMs: number,
    private readonly hostSignal: AbortSignal | undefined
  ) {
    this.aborted = new Promise<never>((_, reject) => {
      this.rejectAborted = reject;
    });
    hostSignal?.addEventListener('abort', this.onHostAbort);
    this.timer = setTimeout(() => this.abort('timeout'), timeoutMs);
    if (hostSignal?.aborted === true) this.abort('cancelled');
  }

  /** Aborted on timeout, host abort, or client close; passed to the transport. */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  /** Set once the operation has been aborted. */
  get reason(): AbortReason | undefined {
    return this.abortReason;
  }

  abort(reason: AbortReason): void {
    if (this.abortReason !== undefined) return;
    this.abortReason = reason;
    this.controller.abort();
    this.rejectAborted(reason);
  }

  /**
   * Starts `work` unless already aborted, and settles with whichever comes
   * first: the work or the abort. Work that loses the race is ignored, so a
   * native call that cannot be interrupted still releases the caller.
   */
  async race<T>(work: () => Promise<T>): Promise<T> {
    if (this.abortReason !== undefined) return this.aborted;
    const running = work();
    running.catch(() => {});
    return Promise.race([running, this.aborted]);
  }

  /** Releases the timer and the host-signal listener. */
  dispose(): void {
    clearTimeout(this.timer);
    this.hostSignal?.removeEventListener('abort', this.onHostAbort);
  }
}
