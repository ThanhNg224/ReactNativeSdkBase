# React Native SDK Base

[![CI](https://github.com/ThanhNg224/ReactNativeSdkBase/actions/workflows/ci.yml/badge.svg)](https://github.com/ThanhNg224/ReactNativeSdkBase/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A template for building a React Native SDK in TypeScript with an Expo native
module: an instance-based client, an injectable HTTP transport, typed errors,
best-effort cancellation, and safe structured operation observability.

The decisions behind it are in the
[design spec](docs/specs/2026-10-05-react-native-sdk-base-design.md); the rules
for changing it are in [ARCHITECTURE](docs/ARCHITECTURE.md) and
[STANDARD](docs/STANDARD.md).

<!-- template:start -->

## Using this template

1. Clone the repository and rename everything in one pass (package, native
   module, Android package, example app IDs, repository URLs):

   ```bash
   npm ci && npm run rename -- --name @acme/payments-sdk --repo acme/payments-sdk
   ```

   `--native-name` (default: `PaymentsSdk`) and `--android-package` (default:
   `expo.modules.paymentssdk`) override the derived names. The tool removes
   itself and this section when it finishes.

2. Reinstall and regenerate:

   ```bash
   npm install && npm --prefix example install && npm run api && npm run verify
   ```

3. Replace the reference capabilities (`health` over HTTP, `device` over the
   native module) by following
   [Adding an HTTP capability](docs/ARCHITECTURE.md#adding-an-http-capability)
   and [Adding a native capability](docs/ARCHITECTURE.md#adding-a-native-capability).
4. Point the example host at your backend in `example/src/core/config.ts`, and
   reset `CHANGELOG.md` and the version for your first release.

<!-- template:end -->

## Support

| Surface      | Minimum                      |
| ------------ | ---------------------------- |
| Expo SDK     | 57                           |
| React Native | 0.86 (New Architecture only) |
| React        | 19.2                         |
| Android      | API 24                       |
| iOS          | 16.4                         |
| Node.js      | 22.13 (tooling)              |

The package is pre-1.0: only `react-native-sdk-base` and
`react-native-sdk-base/testing` are supported entry points, and breaking
changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Installation

```bash
npx expo install react-native-sdk-base
```

The package contains native code. Rebuild your native project afterwards
(`npx expo prebuild` or `npx expo run:android|ios`). Expo Go does not include
it: the HTTP capability still works there, and native operations reject with
`native_unavailable`.

## Usage

```ts
import { SdkClient } from 'react-native-sdk-base';

const sdk = new SdkClient({
  config: { baseUrl: 'https://api.example.com', apiKey: hostSuppliedKey },
});

const health = await sdk.health.check(); // GET /health
const device = await sdk.device.getInfo(); // native module

await sdk.close();
```

Every HTTP request sends `Authorization: Bearer <apiKey>`, `X-Sdk-Version`, and
a fresh 32-character `X-Request-Id`. The constructor validates the config once
and throws `TypeError` for an invalid one.

## Errors

Operations reject with `SdkError`. Detect it with `isSdkError` (not
`instanceof`) and map `code` to your own copy; `message` is developer text.

```ts
import { SdkErrorCodes, isSdkError } from 'react-native-sdk-base';

try {
  await sdk.health.check();
} catch (error) {
  if (!isSdkError(error)) throw error;
  if (error.code === SdkErrorCodes.unauthorized) signOut();
  else if (error.isRetryable) showRetry(error.requestId);
}
```

| Code                 | When                                     | Retryable |
| -------------------- | ---------------------------------------- | --------- |
| `transport`          | No response was received                 | yes       |
| `timeout`            | `requestTimeoutMs` (default 15000) hit   | yes       |
| `cancelled`          | Aborted by `signal` or `close()`         | no        |
| `unauthorized`       | HTTP 401 / 403                           | no        |
| `rate_limited`       | HTTP 429                                 | yes       |
| `client`             | Other HTTP 4xx                           | no        |
| `server`             | HTTP 5xx                                 | yes       |
| `invalid_response`   | A 2xx body or native result is malformed | no        |
| `native_unavailable` | The native module is not linked          | no        |
| `native`             | The native module rejected the call      | no        |

The SDK never retries on its own; `isRetryable` is advice. `requestId` is safe
to show to support staff. `cause` is diagnostic only.

## Cancellation and lifecycle

```ts
const controller = new AbortController();
const pending = sdk.health.check({ signal: controller.signal });
controller.abort(); // pending rejects with code `cancelled`
```

Cancellation is **best-effort**: the SDK stops waiting, but the server may
still have received and processed the request, and native work is not
interrupted. Aborting never closes the client. `close()` is idempotent: it
cancels in-flight operations, waits for them, and closes the owned transport;
later calls reject with a plain `Error`.

## Observability

The SDK is silent by default. Pass an `observer` to receive exactly one
`SdkOperationEvent` per operation (name, request ID, SDK version, outcome,
elapsed time, status, failure code). Events never contain the API key, URL,
headers, or bodies.

## Testing

```ts
import { SdkClient } from 'react-native-sdk-base';
import { FakeSdkHttpTransport, FakeSdkNativeBridge } from 'react-native-sdk-base/testing';

const transport = new FakeSdkHttpTransport().enqueueResponse({
  statusCode: 200,
  body: '{"status":"ok"}',
});
const sdk = new SdkClient({
  config: { baseUrl: 'https://api.example.test', apiKey: 'test' },
  transport,
  nativeBridge: new FakeSdkNativeBridge(),
});
```

## Development

```bash
npm ci && npm --prefix example ci
```

- `npm run dev` — rebuild `build/` on change; the example's Metro reads it like a
  consumer would.
- `npm run verify` — format, lint, typecheck, tests, boundaries, example checks.
- `npm run ci` — verify plus API reports, TypeDoc, package-quality checks, and
  the publish dry-run.
- `npm run packaged-example -- --platform android` — builds the example from a
  packed tarball of committed `HEAD` (requires `ANDROID_HOME`).
- `npm --prefix example run android -- --device` — runs the example host on a
  connected device.

## License

[MIT](LICENSE)
