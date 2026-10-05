#!/usr/bin/env node
// Fails if the publish archive contains anything outside the `files` allow-list intent.
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const [pack] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
  })
);
const files = pack.files.map((file) => file.path);

const allowed = [
  /^build\//,
  /^src\//,
  /^ios\//,
  /^android\/(build\.gradle|src\/main\/)/,
  /^(expo-module\.config\.json|package\.json|README\.md|CHANGELOG\.md|LICENSE)$/,
];
const required = [
  'build/index.js',
  'build/index.d.ts',
  'build/testing.js',
  'build/testing.d.ts',
  'expo-module.config.json',
  'ios/ReactNativeSdkBase.podspec',
  'android/build.gradle',
  'LICENSE',
  'README.md',
  'CHANGELOG.md',
];

const unexpected = files.filter(
  (file) => !allowed.some((pattern) => pattern.test(file)) || /__tests__|__mocks__/.test(file)
);
const missing = required.filter((file) => !files.includes(file));

if (unexpected.length > 0 || missing.length > 0) {
  if (unexpected.length > 0)
    console.error(`Unexpected files in package:\n  ${unexpected.join('\n  ')}`);
  if (missing.length > 0) console.error(`Missing files in package:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`Package contents OK (${files.length} files)`);
