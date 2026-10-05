import type { SdkObserver, SdkOperationEvent } from './operation-event.js';

/** Delivers `event`; observer exceptions and rejected promises are swallowed. */
export function notifyObserver(observer: SdkObserver, event: SdkOperationEvent): void {
  try {
    const result: unknown = observer.onOperation(event);
    if (typeof (result as PromiseLike<unknown> | undefined)?.then === 'function') {
      (result as Promise<unknown>).then(undefined, () => {});
    }
  } catch {
    // Observer failures never affect the operation.
  }
}
