// Keep the Android toolchain stable when `expo prebuild` regenerates android/.
const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidToolchain(config) {
  config = withProjectBuildGradle(config, (modConfig) => {
    const dependency = /classpath\((['"])com\.android\.tools\.build:gradle(?::[^'"]+)?\1\)/;
    if (
      modConfig.modResults.language !== 'groovy' ||
      !dependency.test(modConfig.modResults.contents)
    ) {
      throw new Error(
        'Android toolchain requires a Groovy project build.gradle with the AGP classpath.'
      );
    }
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      dependency,
      "classpath('com.android.tools.build:gradle:8.13.2')"
    );
    return modConfig;
  });

  return withDangerousMod(config, [
    'android',
    (modConfig) => {
      const file = path.join(
        modConfig.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      const content = fs.readFileSync(file, 'utf8');
      if (!/^distributionUrl=.*$/m.test(content)) {
        throw new Error('Android toolchain requires distributionUrl in gradle-wrapper.properties.');
      }
      fs.writeFileSync(
        file,
        content.replace(
          /^distributionUrl=.*$/m,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.6-bin.zip'
        )
      );
      return modConfig;
    },
  ]);
};
