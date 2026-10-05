# React Native SDK Base

A template for building a React Native SDK in TypeScript with an Expo native
module: an instance-based client, an injectable HTTP transport, typed errors,
and safe structured operation observability.

> **Status:** pre-release scaffolding. The public API described in the
> [design spec](docs/specs/2026-10-05-react-native-sdk-base-design.md) is not
> implemented yet.

## Support

| Surface | Minimum |
| --- | --- |
| Expo SDK | 57 |
| React Native | 0.86 (New Architecture only) |
| React | 19.2 |
| Android | API 24 |
| iOS | 16.4 |

The package contains native code. After installing it, rebuild your native
project (`npx expo prebuild` or `npx expo run:android|ios`); Expo Go is not
supported for native capabilities.

## License

[MIT](LICENSE)
