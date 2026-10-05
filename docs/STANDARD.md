# Standards

## Public API

- Every public type is prefixed `Sdk`.
- Every export carries TSDoc; API Extractor treats a missing doc or release tag
  as an error.
- Entry points re-export by name; no `export *`, no default exports.
- `etc/react-native-sdk-base.api.md` is committed. A public API change is not
  done until the regenerated report is reviewed and committed.
- Public signatures never mention `fetch`, Expo, React Native, or
  implementation types. `AbortSignal` is the one deliberate exception.
- Public data is `readonly` interfaces; returned objects are frozen. There is
  no custom value equality.
- `AbortSignal` is the only cancellation contract; cancellation is best-effort
  and never closes the client.
- `sdkVersion` equals the `package.json` `version` and is sent in
  `X-Sdk-Version`; every operation gets a 32-character lowercase hexadecimal
  request ID, sent as `X-Request-Id` on HTTP.
- `SdkClient`'s constructor validates `config` once and throws `TypeError` for
  host programming mistakes.

## Errors

- Operations reject with `SdkError`; nothing returns a result type.
- Hosts and the SDK detect errors with `isSdkError`, never `instanceof`.
- A plain `Error` is for host programming mistakes (use after close), never for
  runtime failures.
- `code` and `isRetryable` come from the executor, status, or native table,
  never from a capability call site.
- `message` never contains `cause`, the URL, headers, bodies, or the API key.
  `cause` is non-enumerable and diagnostic only.

## Observability

- Silent by default. The host may inject an `SdkObserver` or get no events.
- The runner emits exactly one terminal `SdkOperationEvent` per public
  operation, HTTP or native: static operation name, request ID, SDK version,
  outcome, elapsed milliseconds, response status when available, and failure
  code/retry advice.
- Success events omit `failureCode` and `isRetryable`; failure events have both.
  Observer exceptions and rejected thenables are swallowed.
- Events never contain API keys, URL/path/query, headers, bodies, native error
  messages, raw errors, or stack traces. `SdkError.cause` exists only on the
  thrown error.

## Runtime

- Rely only on `fetch`, `AbortController`, timers, `Promise`, and `JSON`.
- Do not use the global `URL`/`URLSearchParams`, `AbortSignal.timeout()`,
  `AbortSignal.any()`, `AbortSignal.reason`, `crypto.getRandomValues`, or
  `TextDecoder` in `src/`.
- v1 bodies are text only.

## Native code

- Every native function is an `AsyncFunction` that returns plain data records.
- Native code never returns or logs secrets, reads no host configuration, and
  holds no mutable static state.
- Native failures use Expo coded errors with an `ERR_SDK_` code; the JS side
  maps the code and never parses a native message.

## Tests

- No component tests in the package — it ships no UI.
- Core tests run in Node through `FakeSdkHttpTransport` and
  `FakeSdkNativeBridge`. Use a local loopback server only to prove the default
  `fetch` transport on the wire; never depend on an external backend.
- Freeze time through the clock seam rather than asserting on ranges.
- Assert request IDs reach every failure path and event, the version header
  matches `package.json`, serialised events and errors never contain the API
  key, URL, or body, and two clients do not interfere.
- The native module is proven by the packaged-consumer build and the example's
  device screen, not by mocking `expo` in package tests.

## Commands

- `npm run verify` — Prettier check, ESLint (zero warnings, import
  boundaries), `tsc --noEmit`, Jest, and `scripts/check-boundaries`.
- `npm run ci` — the CI-equivalent local gate: clean install, verify, API
  Extractor report check, TypeDoc with warnings as errors, publint,
  `@arethetypeswrong/cli`, the `npm pack` file-list check, and
  `npm publish --dry-run`.
- `npm run packaged-example -- --platform android` — the committed-`HEAD`
  artifact consumer gate. It archives `HEAD` with `git archive`, packs it,
  installs the tarball into a staged copy of `example/`, proves resolution
  never reaches the checkout, then runs `expo prebuild --clean`, typecheck,
  tests, and a native build. Use `--platform ios` for the simulator build on
  macOS.

## Release quality

- TypeScript runs with `strict`, `exactOptionalPropertyTypes`, and
  `noUncheckedIndexedAccess`.
- publint and `@arethetypeswrong/cli` must report zero problems for both entry
  points; the `npm pack` file list must match the `files` allow-list exactly.
- CI runs the packaged consumer on Android and iOS for the Expo SDK floor and
  the latest stable SDK. A floor that is never built is not a commitment.
- CI never generates coverage it does not read and never publishes.
- A release is not ready on `npm run ci` alone. Commit the intended release
  files, run `npm run ci` and `npm run packaged-example -- --platform android`,
  then require the GitHub packaged-consumer matrix for Android and iOS. The
  packaged gate intentionally observes committed `HEAD`, not uncommitted
  working-tree changes.
