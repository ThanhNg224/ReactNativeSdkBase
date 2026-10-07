# React Native SDK Base Design

**Status:** Approved — reviewed 2026-10-05, cleared for implementation

**Review decisions (2026-10-05).**

1. The native reference slice stays device/app info (§1, §7).
2. HTTP authentication is `Authorization: Bearer <apiKey>` (§6).
3. No CommonJS build; the package ships only the default `tsc` output (§3).
4. The repository adopts the Flutter base's document set: `AGENTS.md`,
   `docs/ARCHITECTURE.md`, `docs/STANDARD.md`, `docs/GIT_FLOW.md`, and
   `docs/AGENTS.md`. This document becomes decision history.

**Implementation notes (2026-10-05).** Recorded during implementation; the
owning documents (`docs/ARCHITECTURE.md`, `docs/STANDARD.md`) are current.

1. The package is ESM-only: `"type": "module"` and explicit `.js` relative
   imports, so publint and attw (`esm-only` profile) pass (§3, §10).
2. API Extractor keeps one report per entry point:
   `etc/react-native-sdk-base.api.md` and
   `etc/react-native-sdk-base-testing.api.md` (§10).
3. Import boundaries live in `scripts/check-boundaries.cjs`; ESLint owns the
   runtime-global rules (§3, §10).
4. The example's routes are under `example/src/app/` (Expo Router's root), so
   providers live in `example/src/app-providers/` rather than under the routes
   (§9).
5. Missing bundle or package values reject with
   `ERR_SDK_MISSING_APP_METADATA`; `ReactContextLost` maps to `native` (§7).
6. The example's Metro resolves the package through `exports` into `build/`
   (Metro `tsconfigPaths` is off); its `tsc` and Jest read `src/` (§9).
7. The example installs only declared dependencies (`legacy-peer-deps`), which
   keeps Reanimated, Worklets, and Gesture Handler out of the native build;
   Expo Router lists them as optional peers (§9).

**Goal:** Build a publishable React Native SDK template in TypeScript that
carries over the proven contracts of
[`FlutterSdkBase`](../../../FlutterSdkBase/docs/superpowers/specs/2026-09-14-flutter-sdk-base-design.md)
and adds one reference native capability written with the Expo Modules API,
while staying independent of host navigation, UI, state management, and
persistence.

**Package identity:** `react-native-sdk-base` (`React Native SDK Base`),
repository `ReactNativeSdkBase`.

**Approach.** The Flutter base's design decisions are ported; its code is not.
The implementation is written as idiomatic TypeScript for the React Native
runtime (Hermes). §11 lists every decision that was kept and every deliberate
deviation.

## 1. Product Scope

This repository is a template that teams clone before implementing their own
SDK. It is a **standalone Expo module package**: a TypeScript core plus one
small Swift/Kotlin module. It ships no UI and no native views.

The v1 release has two reference vertical slices:

```ts
import { SdkClient } from 'react-native-sdk-base';

const sdk = new SdkClient({
  config: { baseUrl: 'https://api.example.com', apiKey: hostSuppliedKey },
});

const health = await sdk.health.check();     // pure TS: HTTP path
const device = await sdk.device.getInfo();   // native: Expo Module path
await sdk.close();
```

- **`health.check()`** performs `GET /health` and maps a successful JSON body
  such as `{"status":"ok"}` to `SdkHealth`. It shows the complete
  public contract → executor → transport → error → host-test path.
- **`device.getInfo()`** calls the package's native module and returns
  `SdkDeviceInfo` (platform, OS version, app identifier, app version, build
  number). It shows the public contract → executor → native bridge → Swift /
  Kotlin → error → host-test path. App identifier and version come from the
  native bundle/package metadata, which React Native core does not expose.

Both slices exist only to demonstrate their paths. A product team replaces
them and their endpoint when cloning the base.

### In scope

- An instance-based client whose HTTP implementation sits behind SDK-owned
  transport types, with the platform `fetch` as the default transport.
- One Expo native module (iOS Swift, Android Kotlin) behind an SDK-owned
  native bridge type.
- Host-supplied API-key authentication on every HTTP request. Structured
  operation events never contain the key.
- Observation that is silent by default, a single typed error class,
  best-effort cancellation through `AbortSignal`, a timeout, multiple
  concurrent client instances, fake transport and fake native bridge test
  doubles, and an Expo Router example host.
- Android and iOS support for the package's v1 release, on the New
  Architecture only.

### Explicitly out of scope

- Native views, React components, hooks, context providers, navigation,
  theming, localization, or app-wide singletons in the SDK.
- Turbo Modules written by hand, codegen specs, C++/JSI code, and the Legacy
  Architecture.
- Persistence, token caching, session resume, connectivity preflight checks,
  automatic retry, uploads, multipart, binary or streaming bodies.
- Feeding native data into HTTP headers. The two slices are independent so the
  HTTP core runs without the native module (§6).
- Web, macOS, tvOS, and Expo Go support claims. The HTTP slice is expected to
  work there but is not tested or promised. In Expo Go the native slice fails
  with `native_unavailable` (§5), so the SDK still loads.
- Business APIs beyond the two reference slices.

## 2. Support and Compatibility Policy

The support floors are **derived from one chosen Expo SDK floor, not picked
independently**. That floor is **Expo SDK 57**, the latest stable release on
2026-10-05. SDK 58 is in beta with React Native 0.88 RC. The numbers below come
from the
[Expo SDK compatibility table](https://docs.expo.dev/versions/latest/).

| Surface | v1 commitment | Derived from |
| --- | --- | --- |
| Expo SDK | `>=57` | chosen floor |
| React Native | `>=0.86` | Expo SDK 57 |
| React | `>=19.2` | Expo SDK 57 |
| Android host | API 24 (Android 7) or higher; compile/target SDK 36 | Expo SDK 57 |
| iOS host | iOS 16.4 or higher | Expo SDK 57 |
| Xcode (to build) | 26.4 or higher | Expo SDK 57 |
| Node.js (tooling) | `>=22.13` | Expo SDK 57 |
| Architecture | New Architecture only | React Native 0.82+ removed the Legacy Architecture |
| JS engine | Hermes | Expo default |
| Supported platforms | Android and iOS | — |

`peerDependencies` declares `expo`, `react-native`, and `react` at these floors
with **no upper bound**, for the same reason the Flutter base has none: an
upper bound locks hosts out of a future SDK without any demonstrated
incompatibility. Raising the Expo floor means re-deriving every row, and
updating the iOS podspec and CI matrix in the same change.

The package is pre-1.0. Only declarations exported from the two entry points
(§3) are supported API. Removing or changing a public API, changing or
removing an `SdkErrorCodes` value, or raising a support floor is allowed
between pre-1.0 releases. Each such change must be recorded in `CHANGELOG.md`.
Additive changes are preferred. No deprecation period is guaranteed before
`1.0.0`.

### Runtime assumptions

The core relies only on globals that React Native guarantees under Hermes:
`fetch`, `AbortController`, `setTimeout`/`clearTimeout`, `Promise`, and
`JSON`. It deliberately does **not** depend on:

- **`URL` / `URLSearchParams`.** React Native's built-in `URL` is incomplete.
  URL joining is a pure string utility (`joinUrl`, §3).
- **`AbortSignal.timeout()` or `AbortSignal.any()`.** These are not guaranteed
  under React Native. The executor links signals and runs the timeout itself.
- **`crypto.getRandomValues` and `TextDecoder`.** Neither is guaranteed without
  a polyfill. The request ID is a correlation ID, not a secret (§6), and the v1
  body format is text (§6).

## 3. Package Boundary and Layout

The package is scaffolded once with `npx create-expo-module@latest`
(standalone, not `--local`) and then reshaped into this layout. Nothing is
copied from `FlutterSdkBase`.

```text
ReactNativeSdkBase/
├── package.json                 # name, exports, files, peerDependencies
├── expo-module.config.json      # platforms + native module classes
├── src/
│   ├── index.ts                 # supported production entry point
│   ├── testing.ts               # supported test doubles entry point
│   └── internal/                # implementation detail
│       ├── client/              # SdkClient, config normalisation, executor
│       ├── errors/              # SdkError, codes, status + native tables
│       ├── observability/       # observer + event types
│       ├── transport/           # transport types, fetch transport, fake
│       ├── native/              # bridge type, Expo-backed bridge, fake
│       ├── health/              # SdkHealth + service
│       ├── device/              # SdkDeviceInfo + service
│       ├── util/                # joinUrl, request ID
│       └── version.ts           # sdkVersion
├── ios/                         # ReactNativeSdkBase.podspec, Swift module
├── android/                     # build.gradle, Kotlin module
├── example/                     # independent Expo Router host app
├── test/                        # package tests (never shipped)
├── etc/react-native-sdk-base.api.md   # API Extractor report, committed
├── scripts/                     # boundary check, packaged-example gate
└── docs/
```

`package.json` `exports` defines the only two import paths:

```json
{
  "exports": {
    ".": { "types": "./build/index.d.ts", "default": "./build/index.js" },
    "./testing": { "types": "./build/testing.d.ts", "default": "./build/testing.js" },
    "./package.json": "./package.json"
  }
}
```

The build is the default `tsc` output of the template build script in `build/`.
There is no separate CommonJS build: Metro and Jest consume the default output,
and plain Node consumers are not a v1 target.

Metro has enabled package `exports` by default since React Native 0.79, so a
host cannot import `react-native-sdk-base/build/internal/...`. The `files`
field is an allow-list: `build/`, `src/`, `ios/`, `android/`,
`expo-module.config.json`, `README.md`, `CHANGELOG.md`, and `LICENSE`.
`docs/`, `test/`, `scripts/`, `etc/`, and `example/` are never published.

Exports are named only, with no `default` exports and no `export *`. Every
public type is re-exported explicitly from `index.ts` or `testing.ts`. This is
the TypeScript equivalent of Dart's `show`.

**Import boundaries** (enforced by ESLint `no-restricted-imports` plus
`scripts/check-boundaries`):

| From | May import |
| --- | --- |
| `src/internal/native/` | `expo` (for `requireOptionalNativeModule` and `NativeModule` types only) |
| everything else in `src/` | nothing outside `src/` (no `react`, `react-native`, `expo-*`) |
| `example/` | `react-native-sdk-base` and `react-native-sdk-base/testing` only (never `../src`, `../build`, or a deep path) |

The core therefore loads and runs in plain Node, which keeps package tests
fast and native-free. Module-level mutable state is prohibited everywhere in
`src/`, so several `SdkClient` instances can run side by side.

## 4. Public Contract

Every public type name starts with `Sdk` to avoid clashing with host types.
Public data is exposed as `readonly` interfaces. Returned objects are frozen
with `Object.freeze`. There is no custom value equality: hosts and tests
compare structurally (`toEqual`), which is the JavaScript norm.

```ts
export interface SdkConfig {
  /** Absolute http(s) base URL. A trailing slash is optional. */
  readonly baseUrl: string;
  /** Sent on every HTTP request. Never included in events or error text. */
  readonly apiKey: string;
  /** Per-operation timeout. Defaults to 15_000. Must be a positive integer. */
  readonly requestTimeoutMs?: number;
}

export interface SdkClientOptions {
  readonly config: SdkConfig;
  /** Owned by the client from this point on; closed by `close()`. */
  readonly transport?: SdkHttpTransport;
  /** Defaults to the package's Expo native module. */
  readonly nativeBridge?: SdkNativeBridge;
  readonly observer?: SdkObserver;
}

export class SdkClient {
  /** @throws {TypeError} when `config` is invalid (a host programming mistake). */
  constructor(options: SdkClientOptions);
  readonly health: SdkHealthService;
  readonly device: SdkDeviceService;
  /** Idempotent. */
  close(): Promise<void>;
}

/** The package version sent in `X-Sdk-Version` on every request. */
export const sdkVersion: string;

export interface SdkOperationOptions {
  /** Best-effort: the SDK stops waiting; the server may still have received it. */
  readonly signal?: AbortSignal;
}

export interface SdkHealthService {
  /** @throws {SdkError} */
  check(options?: SdkOperationOptions): Promise<SdkHealth>;
}

export interface SdkHealth {
  readonly isHealthy: boolean;
  readonly status: string;
  /** When the SDK observed the response. */
  readonly checkedAt: Date;
}

export interface SdkDeviceService {
  /** @throws {SdkError} */
  getInfo(options?: SdkOperationOptions): Promise<SdkDeviceInfo>;
}

export interface SdkDeviceInfo {
  readonly platform: 'ios' | 'android';
  readonly osVersion: string;
  readonly appId: string;       // iOS bundle identifier / Android applicationId
  readonly appVersion: string;  // CFBundleShortVersionString / versionName
  readonly buildNumber: string; // CFBundleVersion / versionCode
}
```

The constructor validates and normalises `config` once. It rejects a
`baseUrl` that is not an absolute `http:` or `https:` URL, an empty `apiKey`,
and a non-positive or non-integer `requestTimeoutMs`. It keeps a frozen copy,
so mutating the host's object later has no effect.

`sdkVersion` must equal the `package.json` `version`. A package test reads
`package.json` so the wire header cannot drift from the published metadata.

`SdkHealth.checkedAt` comes from an internal clock seam (`() => Date`). It is
reached through an internal factory that `index.ts` does not export, so tests
can freeze time and hosts cannot see it. Each returned `Date` is a new
instance.

**Cancellation.** `signal` is the standard `AbortSignal`, so the SDK does not
invent its own cancel-token type. A host normally uses one controller per
operation. Sharing one signal across operations deliberately groups them. A
signal that is already aborted produces an `SdkError` with code `cancelled`
without opening a transport call or a native call. Aborting never closes the
client. For a native operation, abort means the SDK stops waiting and discards
the result. The native work is not interrupted.

Operations resolve with their value or reject with `SdkError` for expected
runtime failures. There is no `Result` type. Calling an operation after
`close()` rejects with a plain `Error` whose message says the client is
closed. That is host programming misuse, never an `SdkError`.

## 5. Errors and Observability

```ts
export const SdkErrorCodes = {
  cancelled: 'cancelled',
  timeout: 'timeout',
  transport: 'transport',
  unauthorized: 'unauthorized',
  client: 'client',
  rateLimited: 'rate_limited',
  server: 'server',
  invalidResponse: 'invalid_response',
  nativeUnavailable: 'native_unavailable',
  native: 'native',
} as const;

export type SdkErrorCode = (typeof SdkErrorCodes)[keyof typeof SdkErrorCodes];

export class SdkError extends Error {
  readonly name: 'SdkError';
  readonly code: SdkErrorCode;
  readonly isRetryable: boolean;
  readonly statusCode: number | undefined;
  /** Non-empty for every SDK-produced error; safe to show to support staff. */
  readonly requestId: string;
  /** Diagnostic only. Non-enumerable, no compatibility guarantee. */
  readonly cause: unknown;
}

/** Use instead of `instanceof`; survives duplicate package copies in a bundle. */
export function isSdkError(value: unknown): value is SdkError;
```

`message` is concise English text for developers. It is never localised and
never meant for end-user UI; hosts map `code` to their own copy. `message`
never contains `cause`, the URL, headers, the body, or the API key. `cause` is
defined with `Object.defineProperty` as **non-enumerable**, so
`JSON.stringify(error)` and spread copies leave it out. `isSdkError` checks a
brand set under `Symbol.for('react-native-sdk-base.SdkError')`, because Metro
can bundle two copies of the package and `instanceof` then fails.

Every outcome is mapped through one of two tables. Call sites never decide
`code` or `isRetryable` themselves.

| Outcome | `code` | `isRetryable` | Table |
| --- | --- | --- | --- |
| `fetch` / transport rejection | `transport` | `true` | executor |
| `requestTimeoutMs` elapsed | `timeout` | `true` | executor |
| Aborted by `signal` or `close()` | `cancelled` | `false` | executor |
| HTTP 401 or 403 | `unauthorized` | `false` | status |
| HTTP 429 | `rate_limited` | `true` | status |
| Other HTTP 4xx | `client` | `false` | status |
| HTTP 5xx | `server` | `true` | status |
| 2xx body the capability cannot parse | `invalid_response` | `false` | executor |
| Native module not linked (Expo Go, Jest, missing rebuild) | `native_unavailable` | `false` | native |
| Native call rejected | `native` | `false` | native |
| Native result fails shape validation | `invalid_response` | `false` | native |

The SDK never retries automatically. `isRetryable` is advice for the host.

```ts
export interface SdkOperationEvent {
  readonly operation: string;           // static name, e.g. 'health.check'
  readonly requestId: string;
  readonly sdkVersion: string;
  readonly outcome: 'succeeded' | 'failed';
  readonly elapsedMs: number;
  readonly statusCode?: number;
  readonly failureCode?: SdkErrorCode;
  readonly isRetryable?: boolean;
}

export interface SdkObserver {
  onOperation(event: SdkOperationEvent): void;
}
```

Observation is off by default. The executor emits exactly **one** terminal
event per public operation, HTTP or native, including pre-cancelled, timed-out,
and closed outcomes. Success events omit `failureCode` and `isRetryable`;
failure events include both. `statusCode` is present whenever an HTTP response
existed. A throwing observer is ignored. If an observer returns a thenable, its
rejection is caught, so observers can never produce unhandled rejections.
Events never contain credentials, the URL, path, query, headers, bodies, native
error messages, raw errors, or stack traces.

## 6. Operation Path, HTTP Transport, and Lifecycle

There is **one path through the SDK**. Every public operation runs through
`SdkOperationRunner` (internal). The runner owns:

- the closed-state check,
- request-ID creation,
- signal linking and the timeout,
- cancellation on `close()`,
- error normalisation,
- the single terminal event.

`SdkRequestExecutor` is the HTTP specialisation. It applies authentication,
`X-Sdk-Version`, `X-Request-Id`, and the status table. `SdkNativeExecutor` is
its native counterpart: it calls the bridge and applies the native table and
invalid-result mapping (§7). A capability builds a
request or a native call and interprets the result. It never invents its own
error handling, timeout, or retry.

```text
SdkClient ──► SdkOperationRunner ──┬─► SdkRequestExecutor ──► SdkHttpTransport ──► fetch
                  │                │        └── auth + version + request-id headers, status table
                  │                └─► SdkNativeExecutor ──► SdkNativeBridge ──► Expo module (Swift / Kotlin)
                  ├── closed check, request ID, timeout, signal linking
                  ├── error normalisation (executor / status / native tables)
                  └── exactly one safe terminal event
```

```ts
export interface SdkHttpRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}

export interface SdkHttpResponse {
  readonly statusCode: number;
  /** Lower-cased names. */
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface SdkHttpTransport {
  /** Must reject promptly once `signal` aborts; the rejection value is ignored. */
  send(request: SdkHttpRequest, signal: AbortSignal): Promise<SdkHttpResponse>;
  /** Called once by the owning client's `close()`. */
  close?(): Promise<void>;
}
```

- **Text bodies only in v1.** `fetch` gives text directly (`response.text()`),
  and avoiding `TextDecoder` keeps Hermes free of polyfills. Binary, multipart,
  or streaming bodies require a deliberate, versioned contract extension.
- **`send(request, signal)` replaces Flutter's `open()`/`SdkHttpCall`.** The
  Flutter split existed because `package:http` has no per-request abort.
  `fetch` does, so a single call that takes a signal is the idiomatic contract.
- **The default transport is the global `fetch`.** No HTTP library is a
  dependency. A host may inject its own transport. A transport passed to a
  client is owned by that client and must not be shared between clients.
- **Cancellation is best-effort, and that is a documented public promise.**
  Under React Native, aborting `fetch` cancels the native request task, which
  is stronger than the Flutter base. It is still not proof that the server did
  not receive or process the request. This is stated in the `signal` API doc
  and the README.
- **The executor, not the transport, owns the timeout and the reason for each
  abort.** It aborts its own controller and maps the transport's rejection by
  that reason: `timeout`, `cancelled` (signal or close), or `transport` (no
  abort). It does not rely on `AbortSignal.reason`.
- **Every HTTP request carries two headers.** `X-Sdk-Version: <sdkVersion>`
  and a fresh `X-Request-Id`: 32 lowercase hex characters (128 bits) generated
  internally. The ID only correlates a request across systems and makes no
  unpredictability claim. Native operations get a request ID too, so every
  event and error is correlated the same way.
- **Authentication.** Every HTTP request sends `Authorization: Bearer <apiKey>`.
  The header is built in one place in the executor; a team cloning the base for
  a different scheme changes only that place. The key appears nowhere else.

`close()` is idempotent and does the following in order:

1. Rejects new operations.
2. Aborts every in-flight operation, which settles as `cancelled`.
3. Waits for each to settle.
4. Calls the owned transport's `close?.()`.
5. Resolves.

It does not persist, retry, or restart anything. The native bridge has no
close step in v1.

## 7. Native Module

The native module is defined with the Expo Modules API and registered in
`expo-module.config.json`. iOS and Android each have one module class with a
single `Name("ReactNativeSdkBase")`.

```swift
// ios/ReactNativeSdkBaseModule.swift (sketch)
public final class ReactNativeSdkBaseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeSdkBase")
    AsyncFunction("getDeviceInfoAsync") { () -> [String: String] in /* bundle + UIDevice */ }
  }
}
```

```kotlin
// android/.../ReactNativeSdkBaseModule.kt (sketch)
class ReactNativeSdkBaseModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ReactNativeSdkBase")
    AsyncFunction("getDeviceInfoAsync") { /* PackageManager + Build.VERSION */ }
  }
}
```

**Native rules**

- Native code returns plain data records only. It never returns or logs
  secrets, and it reads no host-supplied configuration.
- Every native function is an `AsyncFunction`, so nothing blocks the JS thread.
  The JS side never relies on synchronous native calls.
- Native failures are thrown as Expo `CodedError` / `CodedException`, using
  codes prefixed `ERR_SDK_`. The JS side never parses a native message.
- Native code holds no mutable static state that one `SdkClient` could leak to
  another.

**Bridge seam.** The public contract sees only:

```ts
export interface SdkNativeBridge {
  getDeviceInfo(): Promise<unknown>;
}
```

The default bridge lives in `src/internal/native/`. It calls
`requireOptionalNativeModule('ReactNativeSdkBase')` **lazily**, on first use,
not at import time. As a result, importing the SDK never throws in Expo Go,
Jest, or a host that has not rebuilt its native project. A missing module
becomes `native_unavailable` at the call site. The bridge returns `unknown` on
purpose: `SdkDeviceService` validates the shape and maps a mismatch to
`invalid_response`. The bridge contract therefore stays the same when native
code changes, and malformed native output can never be typed as valid.

Adding a native capability means:

1. Add the Swift and Kotlin `AsyncFunction`.
2. Add a bridge method.
3. Add a capability service that validates the result and calls the runner.
4. Add any new `ERR_SDK_*` codes to the native table and any new
   `SdkErrorCodes` to `CHANGELOG.md`.

## 8. Persistence and Connectivity

These rules are unchanged from the Flutter base:

- v1 has no persistence. It caches no tokens and stores no configuration.
- No storage or connectivity package is a dependency. Preflight connectivity
  checks are prohibited, because the SDK performs the request and maps what it
  observed.
- A future capability that needs persistence first introduces an SDK-owned,
  injectable contract. A storage library is never a hidden global dependency.

## 9. Example Host and Test Doubles

`example/` is an independent Expo app, scaffolded by `create-expo-module` and
then converted to **Expo Router**. It is a host, not SDK-owned UI. It runs as
a development build (`expo run:ios` / `expo run:android` or `expo-dev-client`),
never Expo Go, because it exercises the native slice.

This structure mirrors the Flutter demo host:

```text
example/
├── app/                         # Expo Router: _layout.tsx, (tabs)/health.tsx, (tabs)/settings.tsx, (tabs)/device.tsx
└── src/
    ├── app/providers/           # SdkClientProvider (host-owned React context), QueryClientProvider
    ├── core/                    # config, error-to-copy mapping, observability
    └── features/                # one flat folder per feature: screen, hook, SDK call
        ├── health/              # HealthScreen, use-health-check, check-health
        ├── device/              # DeviceScreen, use-device-details, read-device-details
        └── settings/            # SettingsScreen
```

- The bottom tab navigator is owned by the `(tabs)` layout. Feature screens do
  not build routes.
- **TanStack Query** owns async state. The SDK client is created once per app
  by the host provider and closed on unmount. No global state library is
  added; nothing in the example needs one.
- Each feature's SDK-call function (`check-health.ts`, `read-device-details.ts`)
  is the only place that touches `SdkClient`. It maps `SdkHealth`,
  `SdkDeviceInfo`, and `SdkError` to host-owned values. Screens never construct
  SDK calls. Split a feature into subfolders only when it outgrows a few files.
- The example is deterministic. HTTP goes through `FakeSdkHttpTransport` behind
  a host-only demo transport. The device tab uses the **real** native module,
  because proving that path is the point of the slice. Settings shows read-only
  diagnostics: environment label, base URL, `sdkVersion`, and the transport
  description. It never displays the API key.

`react-native-sdk-base/testing` exports `FakeSdkHttpTransport` and
`FakeSdkNativeBridge`. Each has queued or handler-based responses and failures,
and records what it received. Together they support tests of status mapping,
timeout, cancellation, close, multiple instances, native unavailability, and
malformed native output. They are supported test helpers, not production
implementations.

## 10. Quality and Release Gates

npm is the package manager, with a committed `package-lock.json`. pnpm-style
symlinked layouts are a known source of Metro resolution failures, so they are
not used. `npm run verify` and `npm run ci` are the single entry points, the
equivalents of `make verify` and `make ci`.

1. **verify:** `prettier --check`, `eslint --max-warnings 0` (with
   type-aware rules and the import boundaries from §3), `tsc --noEmit` under
   `strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`, Jest,
   and `scripts/check-boundaries`.
2. **Public API lock:** API Extractor regenerates
   `etc/react-native-sdk-base.api.md`, and CI fails if it differs from the
   committed report. Every exported symbol has TSDoc (`ae-missing-release-tag`
   and undocumented-export checks are errors). Public signatures never mention
   `fetch`, Expo, or React Native types; `AbortSignal` is the one deliberate
   exception, because it is a platform standard.
3. **Docs:** TypeDoc builds with `treatWarningsAsErrors`.
4. **Package quality:** `publint` and `@arethetypeswrong/cli` report zero
   problems for both entry points. `npm pack --dry-run` must list exactly the
   `files` allow-list, and the check fails on any `docs/`, `test/`, or
   `example/` path.
5. **Tests:** core tests run in Node through the fakes. One loopback HTTP
   server test proves the default `fetch` transport on the wire, with no
   external backend. Time is frozen through the clock seam. Tests assert that
   the request ID reaches every failure path and event, that the version header
   matches `package.json`, that no event or `SdkError` serialisation contains
   the API key, URL, or body, and that two clients with different configs do
   not interfere.
6. **Packaged consumer:** `npm run packaged-example` archives committed `HEAD`
   with `git archive`, runs `npm pack` on it, and installs the tarball into a
   staged copy of `example/`. It proves resolution never reaches the checkout,
   then runs `expo prebuild --clean`, typecheck, tests, and a native build.
   Android builds only the ABI of the target device (`arm64-v8a` by default),
   following the sibling repositories' convention. iOS builds for the
   simulator on macOS. This gate is what proves that autolinking finds the
   module from the published files alone.
7. **CI matrix:** the Expo SDK floor (57) and the latest stable SDK, each with
   its required Node version, running the packaged consumer on Android and iOS.
   A floor that is never compiled is not a support commitment.
8. CI does not generate coverage it does not read, and never publishes. It runs
   `npm publish --dry-run` only.

`README.md` covers installation (including "rebuild your native project; Expo
Go is not supported for the native slice"), minimal usage, error handling,
cancellation semantics, lifecycle, the support matrix, and the testing entry
point. `CHANGELOG.md`, `LICENSE`, and the API report are release requirements.

## 11. Mapping from FlutterSdkBase

**Kept unchanged:**

- the instance-based client with no mutable global state,
- one path through the SDK,
- one failure table,
- `isRetryable` as advice with no automatic retry,
- one safe terminal event per operation,
- the request-ID and version headers,
- the API key never appearing in events or error text,
- an injectable transport owned by its client,
- silent-by-default observation,
- supported fakes in a separate entry point,
- the clock seam,
- the boundary checks,
- the packaged-consumer gate from committed `HEAD`,
- support floors derived rather than picked,
- no upper bound on the framework constraint,
- no persistence and no connectivity preflight,
- a consumer-first implementation order.

**Deliberate deviations:**

| Flutter base | React Native base | Reason |
| --- | --- | --- |
| `SdkCancelToken` | standard `AbortSignal` | Platform standard; `fetch` consumes it directly |
| `SdkException` wrapping `SdkFailure` | one `SdkError extends Error` + `isSdkError` | JS convention; the brand check survives duplicate bundles |
| Value equality on public types | Frozen `readonly` interfaces, structural comparison | JS has no `==` override; `toEqual` is the norm |
| `open()` → `SdkHttpCall` with `cancel()` | `send(request, signal)` | `fetch` supports per-request abort |
| `Uint8List` bodies | `string` bodies | Avoids `TextDecoder` under Hermes; JSON APIs are text |
| `Uri baseUri` | validated `string baseUrl` + `joinUrl` | React Native's `URL` is incomplete |
| `SdkRequestExecutor` as the only path | `SdkOperationRunner`, with the executor as its HTTP specialisation | Native operations need the same lifecycle, IDs, and events |
| Barrels with `show` | `exports` map + explicit named re-exports + API Extractor report | TS has no `show`; the report makes API changes reviewable |
| `public_member_api_docs`, Pana | TSDoc + API Extractor, TypeDoc, publint, attw | Equivalent tooling for npm |
| No native code | One Expo module slice + `native_unavailable` / `native` codes | Explicit requirement of this base |
| `make verify` / `make ci` | `npm run verify` / `npm run ci` | One toolchain, no extra wrapper |

## 12. Implementation Order

1. Scaffold with `create-expo-module` and strip the template's sample view,
   events, and constants. Set package metadata, `exports`, `files`, peer
   floors, the podspec iOS 16.4 floor, `CHANGELOG.md`, and `LICENSE`. Make
   `npm publish --dry-run` pass from the first commit.
2. Write `index.ts` / `testing.ts` declarations with TSDoc, and commit the
   first API Extractor report.
3. Write failing tests for config validation, the error class and tables,
   headers, timeout, cancellation, close, multiple instances, events, and both
   fakes.
4. Implement the runner, executor, fetch transport, and health slice.
5. Implement the Swift and Kotlin module, the lazy bridge, and the device slice.
6. Rebuild `example/` as the Expo Router host against the two public entry
   points only.
7. Add the boundary, API-report, package-quality, packaged-consumer, and
   Android/iOS matrix gates.
8. Run every gate and review the public API as a consumer before any `1.0.0`
   release.
