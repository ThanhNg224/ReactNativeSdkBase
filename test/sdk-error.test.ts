import { SdkError, SdkErrorCodes, isSdkError } from '../src/index';

const init = {
  code: SdkErrorCodes.server,
  message: 'The server answered HTTP 503.',
  isRetryable: true,
  requestId: 'a'.repeat(32),
  statusCode: 503,
  cause: { url: 'https://secret.example.test/?token=abc' },
};

test('exposes stable fields and keeps cause non-enumerable', () => {
  const error = new SdkError(init);
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe('SdkError');
  expect(error.code).toBe('server');
  expect(error.cause).toBe(init.cause);
  expect(Object.keys(error)).not.toContain('cause');
  expect(JSON.stringify(error)).not.toContain('secret');
  expect(JSON.stringify({ ...error })).not.toContain('secret');
  expect(String(error)).toBe('SdkError: The server answered HTTP 503.');
});

test('requires a non-empty requestId', () => {
  expect(() => new SdkError({ ...init, requestId: '' })).toThrow(TypeError);
});

test('isSdkError recognises SdkError and rejects look-alikes', () => {
  expect(isSdkError(new SdkError(init))).toBe(true);
  expect(isSdkError(new Error('x'))).toBe(false);
  expect(isSdkError({ ...new SdkError(init), name: 'SdkError' })).toBe(false);
  expect(isSdkError(null)).toBe(false);
});

test('isSdkError recognises an error from another copy of the package', () => {
  jest.isolateModules(() => {
    // Inside isolateModules this loads a second, independent copy of the module.
    const copy = jest.requireActual<typeof import('../src/internal/errors/sdk-error')>(
      '../src/internal/errors/sdk-error'
    );
    const foreign = new copy.SdkError(init);
    expect(foreign).not.toBeInstanceOf(SdkError);
    expect(isSdkError(foreign)).toBe(true);
  });
});
