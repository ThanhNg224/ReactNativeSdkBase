# Agent guidance

## Source of truth

- This file defines contribution workflow and package-wide invariants.
- `docs/ARCHITECTURE.md`: layers, operation path, and capability changes.
- `docs/STANDARD.md`: public API, errors, observability, native code, and tests.
- `docs/specs/2026-10-05-react-native-sdk-base-design.md`: approved design decisions.
- `docs/GIT_FLOW.md`: branches, commits, and release flow.
- `docs/AGENTS.md`: rules for editing documentation.

Read only the document relevant to the requested change. Keep a rule in one
authoritative place and link to it elsewhere instead of copying it.

## Package invariants

- Treat Expo SDK `>=57`, React Native `>=0.86`, React `>=19.2`, Android API 24+,
  iOS 16.4+, Node.js `>=22.13`, and the New Architecture as support contracts.
  Floors are derived from the Expo SDK floor; never raise one alone.
- Keep host UI, React components and hooks, routing, state management,
  persistence, and mutable module-level state out of `src/`.
- Only `src/internal/native/` may import `expo`; the rest of `src/` imports
  nothing outside `src/`, so the core runs in plain Node.
- Consumers use the two `exports` entry points (`react-native-sdk-base` and
  `react-native-sdk-base/testing`); `src/internal/` is implementation detail.
- Route every operation through `SdkOperationRunner`, HTTP through
  `SdkRequestExecutor`, and native calls through `SdkNativeExecutor`. Preserve central error mapping, timeout, cancellation,
  authentication, and one safe terminal event per operation. Events must not
  contain credentials, URL/path/query, headers, bodies, native error messages,
  raw errors, or stack traces.

## Build and verification

- Use npm with the committed `package-lock.json`; do not switch package
  managers.
- Build the example for only the ABI of the device being used. The example's
  config plugin (`example/plugins/with-android-build-performance.js`) defaults
  to `arm64-v8a` with the Gradle build cache on; pass
  `-PreactNativeArchitectures=x86_64` only for an x86_64 emulator.
- `example/.npmrc` sets `legacy-peer-deps`, so npm installs only declared
  dependencies (it would otherwise pull optional native peers such as
  Reanimated). Declare any required peer explicitly with `npx expo install`.
- Use `npm run clean` to remove generated outputs, the example's native
  projects, and native build output inside `node_modules`; later builds
  recreate them.
- After changing `ios/`, `android/`, or `expo-module.config.json`, rebuild the
  example's native project (`npx expo prebuild --clean`); Metro reload alone
  does not pick up native changes.
- The example's Metro resolves the package through `exports` into `build/`,
  like a consumer; keep `npm run dev` (`tsc --watch`) running while editing
  `src/` against the example. Jest and `tsc` in `example/` read `src/` directly.
- For source changes, run `npm run verify` and inspect the diff. Run
  `npm run ci` for CI or release-facing changes, and `npm run packaged-example`
  for native, packaging, or `exports` changes. For documentation-only changes,
  verify the diff and affected links without running unrelated gates.
