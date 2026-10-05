# Architecture

`react-native-sdk-base` is an Expo module package: a TypeScript core plus one
Swift/Kotlin module. It has four rules.

## 1. Everything is behind two entry points

`package.json` `exports` exposes only `react-native-sdk-base` (`src/index.ts`)
and `react-native-sdk-base/testing` (`src/testing.ts`). Everything under
`src/internal/` may change in any release. A new public type is added by
re-exporting it by name from one entry point; there is no `export *`.

## 2. The core owns no host concerns

`src/` contains no React components, hooks, context, navigation, theming,
persistence, or mutable module-level state — several `SdkClient` instances
must run side by side. Only `src/internal/native/` imports `expo`; the rest of
`src/` imports nothing outside `src/`, so the core loads and runs in plain
Node. `scripts/check-boundaries.cjs` enforces these rules and the example's
import boundary.

## 3. One path through the SDK

Every public operation goes through `SdkOperationRunner`. It owns the
closed-state check, the request ID, cancellation on `close()`, error
normalisation, and the single terminal event; each operation's
`OperationLifetime` links the host signal and the timeout to one abort. HTTP
capabilities use its `SdkRequestExecutor` specialisation; native capabilities
call it with the native bridge. A capability builds a request or a native call
and interprets the result; it never invents its own error handling, timeout,
or retry policy.

```
SdkClient ──► SdkOperationRunner ──┬─► SdkRequestExecutor ──► SdkHttpTransport ──► fetch
                  │                │        ├── Authorization: Bearer <apiKey>
                  │                │        ├── X-Sdk-Version + X-Request-Id
                  │                │        └── status table
                  │                └─► SdkNativeBridge ──► Expo module (Swift / Kotlin)
                  │                         └── native table
                  ├── closed check, request ID, timeout, signal linking
                  └── exactly one safe terminal event
```

## 4. Native code is optional at runtime

The default `SdkNativeBridge` resolves the module with
`requireOptionalNativeModule('ReactNativeSdkBase')` on first use, never at
import time. Without the module (Expo Go, Jest, a stale native build) the SDK
still loads, HTTP capabilities work, and native operations fail with
`native_unavailable`. The bridge returns `unknown`; the capability validates
the shape.

## Adding an HTTP capability

1. Add `src/internal/<capability>/` with a value type and a service.
2. Construct the service internally with the executor; it is not
   host-constructible.
3. Build the URL with `joinUrl`; never use the global `URL`.
4. Let the executor apply headers, map non-2xx through the status table, and
   capture one terminal event. Parse only 2xx bodies; map unparseable bodies to
   `invalid_response`.
5. Expose it from `SdkClient` and re-export its public types by name from
   `src/index.ts`, with TSDoc and an `@public` tag.
6. Add new error codes to `SdkErrorCodes` and `CHANGELOG.md`, then run
   `npm run api` and commit the regenerated reports.

## Adding a native capability

1. Add an `AsyncFunction` to the Swift and Kotlin modules. Throw failures as
   Expo coded errors with an `ERR_SDK_` code.
2. Add a method returning `Promise<unknown>` to `SdkNativeBridge` and to
   `FakeSdkNativeBridge`. This breaks hand-written bridges, so record it in
   `CHANGELOG.md`.
3. Add a service that validates the result, maps a mismatch to
   `invalid_response`, and runs through the runner.
4. Map any new `ERR_SDK_` codes in the native table; follow steps 5–6 above.
5. Rebuild the example's native project and run the packaged-consumer gate.

Cancellation uses the standard `AbortSignal` and is best-effort: it stops the
SDK waiting and never closes the client. The runner adds a fresh request ID to
every operation, and the executor sends it as `X-Request-Id` with
`X-Sdk-Version`; every failure retains that ID.
