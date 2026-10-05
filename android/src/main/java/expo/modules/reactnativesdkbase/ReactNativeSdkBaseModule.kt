package expo.modules.reactnativesdkbase

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ReactNativeSdkBaseModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ReactNativeSdkBase")

    AsyncFunction("getDeviceInfoAsync") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val packageInfo = packageInfo(context.packageManager, context.packageName)
      mapOf(
        "platform" to "android",
        "osVersion" to Build.VERSION.RELEASE,
        "appId" to context.packageName,
        "appVersion" to (packageInfo.versionName ?: ""),
        "buildNumber" to buildNumber(packageInfo),
      )
    }
  }

  private fun packageInfo(packageManager: PackageManager, packageName: String): PackageInfo =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
    } else {
      @Suppress("DEPRECATION")
      packageManager.getPackageInfo(packageName, 0)
    }

  private fun buildNumber(packageInfo: PackageInfo): String =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      packageInfo.longVersionCode.toString()
    } else {
      @Suppress("DEPRECATION")
      packageInfo.versionCode.toString()
    }
}
