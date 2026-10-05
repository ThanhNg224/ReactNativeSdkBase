/**
 * Returns 32 lowercase hex characters (128 bits).
 *
 * A correlation ID only: it makes no unpredictability claim, so it does not
 * need `crypto.getRandomValues`, which React Native does not guarantee.
 */
export function createRequestId(): string {
  let id = '';
  for (let i = 0; i < 4; i += 1) {
    id += Math.floor(Math.random() * 0x100000000)
      .toString(16)
      .padStart(8, '0');
  }
  return id;
}
