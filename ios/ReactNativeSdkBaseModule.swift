import ExpoModulesCore

public final class ReactNativeSdkBaseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeSdkBase")

    AsyncFunction("getDeviceInfoAsync") { () throws -> [String: String] in
      let bundle = Bundle.main
      let os = ProcessInfo.processInfo.operatingSystemVersion
      var osVersion = "\(os.majorVersion).\(os.minorVersion)"
      if os.patchVersion != 0 {
        osVersion += ".\(os.patchVersion)"
      }
      return [
        "platform": "ios",
        "osVersion": osVersion,
        "appId": try required(bundle.bundleIdentifier, "CFBundleIdentifier"),
        "appVersion": try required(
          bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
          "CFBundleShortVersionString"
        ),
        "buildNumber": try required(
          bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String,
          "CFBundleVersion"
        ),
      ]
    }
  }

  private func required(_ value: String?, _ key: String) throws -> String {
    guard let value, !value.isEmpty else {
      throw Exception(
        name: "MissingAppMetadataException",
        description: "The app bundle has no \(key).",
        code: "ERR_SDK_MISSING_APP_METADATA"
      )
    }
    return value
  }
}
