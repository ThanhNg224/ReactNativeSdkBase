import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const repoRoot = join(__dirname, '..');
const script = join(repoRoot, 'scripts', 'rename.cjs');
let work: string;

function listFiles(root: string): string[] {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((file) => file && existsSync(join(root, file)));
}

beforeAll(() => {
  work = mkdtempSync(join(tmpdir(), 'rnsdk-rename-'));
  for (const file of listFiles(repoRoot)) {
    cpSync(join(repoRoot, file), join(work, file), { recursive: true });
  }
  execFileSync('git', ['init', '-q'], { cwd: work });
  execFileSync('git', ['add', '-A'], { cwd: work });
  execFileSync(
    'node',
    [script, '--name', '@acme/payments-sdk', '--repo', 'acme/payments-sdk', '--root', work],
    { cwd: work, encoding: 'utf8' }
  );
}, 60_000);

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

const read = (file: string) => readFileSync(join(work, file), 'utf8');

test('renames package, native module, Android package, and repository', () => {
  expect(JSON.parse(read('package.json')).name).toBe('@acme/payments-sdk');
  expect(read('package.json')).toContain('github.com/acme/payments-sdk');
  expect(JSON.parse(read('example/package.json')).name).toBe('payments-sdk-example');
  expect(read('expo-module.config.json')).toContain('expo.modules.paymentssdk.PaymentsSdkModule');
  expect(read('example/app.json')).toContain('"package": "expo.modules.paymentssdk.example"');
  expect(read('src/internal/native/expo-native-bridge.ts')).toContain("'PaymentsSdk'");
  expect(read('api-extractor.json')).toContain('"payments-sdk.api.md"');
});

test('moves files whose paths carry the old names', () => {
  for (const file of [
    'ios/PaymentsSdk.podspec',
    'ios/PaymentsSdkModule.swift',
    'android/src/main/java/expo/modules/paymentssdk/PaymentsSdkModule.kt',
    'etc/payments-sdk.api.md',
    'etc/payments-sdk-testing.api.md',
  ]) {
    expect(existsSync(join(work, file))).toBe(true);
  }
  expect(existsSync(join(work, 'android/src/main/java/expo/modules/reactnativesdkbase'))).toBe(
    false
  );
  expect(read('android/src/main/java/expo/modules/paymentssdk/PaymentsSdkModule.kt')).toContain(
    'package expo.modules.paymentssdk'
  );
});

test('leaves no template identifiers outside the approved specs', () => {
  const leftovers = listFiles(work)
    .filter((file) => !file.startsWith('docs/specs/') && !file.endsWith('.png'))
    .filter((file) =>
      /react-native-sdk-base(?!-design)|ReactNativeSdkBase|reactnativesdkbase/.test(read(file))
    );
  expect(leftovers).toEqual([]);
  expect(
    existsSync(join(work, dirname('docs/specs/2026-10-05-react-native-sdk-base-design.md')))
  ).toBe(true);
  expect(read('AGENTS.md')).toContain('docs/specs/2026-10-05-react-native-sdk-base-design.md');
});

test('removes itself and the template-only README section', () => {
  expect(existsSync(join(work, 'scripts/rename.cjs'))).toBe(false);
  expect(existsSync(join(work, 'test/rename.test.ts'))).toBe(false);
  expect(JSON.parse(read('package.json')).scripts.rename).toBeUndefined();
  expect(read('README.md')).not.toContain('template:start');
  expect(read('README.md')).toContain('# Payments Sdk');
});
