// The iOS 27 SDK refuses to launch apps that do not adopt the scene-based life cycle
// ("UIScene lifecycle is required"). Expo SDK 57 ships `ExpoAppSceneDelegate` but its
// `expo prebuild` template still creates the window in `AppDelegate`; SDK 58's template adopts
// scenes itself. This mirrors the SDK 58 template on SDK 57 and does nothing once the
// generated `AppDelegate` already provides the factory. Delete it after upgrading to SDK 58.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_START = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

const WINDOW_START_REPLACEMENT = `// The window is created and React Native is started by \`SceneDelegate\` under the
    // scene-based life cycle (required by the iOS 27 SDK).`;

const SCENE_DELEGATE = `
@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {}
`;

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    // The template changed: fail loudly rather than ship an app that cannot launch on iOS 27.
    throw new Error(
      `with-ios-scene-lifecycle: expected AppDelegate.swift to contain:\n${search}\n` +
        'The Expo template changed; update or remove plugins/with-ios-scene-lifecycle.js.'
    );
  }
  return source.replace(search, replacement);
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (mod) => {
    let contents = mod.modResults.contents;
    if (contents.includes('ExpoReactNativeFactoryProvider')) return mod;
    contents = replaceOnce(
      contents,
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
    );
    contents = replaceOnce(contents, WINDOW_START, WINDOW_START_REPLACEMENT);
    mod.modResults.contents = contents + SCENE_DELEGATE;
    return mod;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return mod;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
