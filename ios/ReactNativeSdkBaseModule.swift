import ExpoModulesCore

public final class ReactNativeSdkBaseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeSdkBase")

    AsyncFunction("getDeviceInfoAsync") { () -> [String: String] in
      let bundle = Bundle.main
      let os = ProcessInfo.processInfo.operatingSystemVersion
      var osVersion = "\(os.majorVersion).\(os.minorVersion)"
      if os.patchVersion != 0 {
        osVersion += ".\(os.patchVersion)"
      }
      return [
        "platform": "ios",
        "osVersion": osVersion,
        "appId": bundle.bundleIdentifier ?? "",
        "appVersion": bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "",
        "buildNumber": bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "",
      ]
    }
  }
}
