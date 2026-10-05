#!/usr/bin/env node
// The packaged-consumer gate (docs/STANDARD.md#commands).
//
// Archives committed HEAD, packs it, installs the tarball into a staged copy of
// example/, proves resolution and autolinking never reach the checkout, then
// typechecks, tests, prebuilds, and builds the native app.
//
// Usage: node scripts/packaged-example.cjs --platform android|ios
//          [--abi arm64-v8a] [--expo floor|latest] [--keep]
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const packageName = 'react-native-sdk-base';

function parseArgs(argv) {
  const args = { platform: undefined, abi: 'arm64-v8a', expo: 'floor', keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--keep') args.keep = true;
    else if (['--platform', '--abi', '--expo'].includes(flag)) args[flag.slice(2)] = argv[(i += 1)];
    else throw new Error(`Unknown argument: ${flag}`);
  }
  if (!['android', 'ios'].includes(args.platform)) {
    throw new Error('--platform must be android or ios');
  }
  if (!['floor', 'latest'].includes(args.expo)) throw new Error('--expo must be floor or latest');
  return args;
}

function run(command, args, cwd, env = {}) {
  console.log(`\n$ ${[command, ...args].join(' ')}  (${path.relative(os.tmpdir(), cwd) || cwd})`);
  execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1', ...env } });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function assertInside(label, resolved, directory) {
  const real = fs.realpathSync(resolved);
  if (!real.startsWith(fs.realpathSync(directory) + path.sep)) {
    throw new Error(`${label} resolved outside the staged consumer: ${real}`);
  }
  if (real.startsWith(fs.realpathSync(repoRoot) + path.sep)) {
    throw new Error(`${label} resolved into the checkout: ${real}`);
  }
  console.log(`${label}: ${real}`);
}

/** Turns the in-repo example into a plain consumer of the packed tarball. */
function stageConsumer(consumer, tarball) {
  const pkgFile = path.join(consumer, 'package.json');
  const pkg = readJson(pkgFile);
  pkg.dependencies = { ...pkg.dependencies, [packageName]: `file:${tarball}` };
  if (pkg.expo?.autolinking) delete pkg.expo.autolinking.nativeModulesDir;
  if (pkg.expo?.autolinking && Object.keys(pkg.expo.autolinking).length === 0) {
    delete pkg.expo.autolinking;
  }
  if (pkg.expo && Object.keys(pkg.expo).length === 0) delete pkg.expo;
  writeJson(pkgFile, pkg);

  fs.writeFileSync(
    path.join(consumer, 'metro.config.js'),
    "const { getDefaultConfig } = require('expo/metro-config');\n\nmodule.exports = getDefaultConfig(__dirname);\n"
  );

  const tsconfigFile = path.join(consumer, 'tsconfig.json');
  const tsconfig = readJson(tsconfigFile);
  if (tsconfig.compilerOptions) delete tsconfig.compilerOptions.paths;
  writeJson(tsconfigFile, tsconfig);

  // The in-repo Jest config maps the package to ../src; the consumer uses the tarball.
  const jestFile = path.join(consumer, 'jest.config.js');
  if (fs.existsSync(jestFile)) {
    fs.writeFileSync(
      jestFile,
      fs.readFileSync(jestFile, 'utf8').replace(/^.*\.\.\/src.*$\n?/gm, '')
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rnsdk-packaged-'));
  const source = path.join(work, 'source');
  const consumer = path.join(work, 'consumer');
  console.log(`Staging in ${work}`);
  try {
    fs.mkdirSync(source);
    execSync(`git archive --format=tar HEAD | tar -x -C "${source}"`, {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    run('npm', ['ci', '--no-audit', '--no-fund'], source);
    const packed = JSON.parse(
      execFileSync('npm', ['pack', '--json', '--pack-destination', work], {
        cwd: source,
        encoding: 'utf8',
      })
    );
    const tarball = path.join(work, packed[0].filename);
    console.log(`Packed ${tarball}`);

    fs.cpSync(path.join(source, 'example'), consumer, { recursive: true });
    stageConsumer(consumer, tarball);
    fs.rmSync(source, { recursive: true, force: true });

    run('npm', ['install', '--no-audit', '--no-fund'], consumer);
    if (args.expo === 'latest') {
      run('npx', ['expo', 'install', 'expo@latest'], consumer);
      run('npx', ['expo', 'install', '--fix'], consumer);
    }

    const resolveFrom = (specifier) =>
      execFileSync('node', ['-p', `require.resolve(${JSON.stringify(specifier)})`], {
        cwd: consumer,
        encoding: 'utf8',
      }).trim();
    assertInside('Package resolution', resolveFrom(`${packageName}/package.json`), consumer);
    const autolinked = JSON.parse(
      execFileSync(
        'npx',
        [
          'expo-modules-autolinking',
          'search',
          '--json',
          '--platform',
          args.platform === 'ios' ? 'apple' : 'android',
        ],
        { cwd: consumer, encoding: 'utf8' }
      )
    )[packageName];
    if (!autolinked) throw new Error('Autolinking did not find the native module.');
    assertInside('Autolinked module', autolinked.path, consumer);

    run('npm', ['run', 'typecheck'], consumer);
    run('npm', ['test'], consumer);

    if (args.platform === 'android') {
      run(
        'npx',
        ['expo', 'prebuild', '--clean', '--platform', 'android', '--no-install'],
        consumer
      );
      run(
        './gradlew',
        ['assembleRelease', `-PreactNativeArchitectures=${args.abi}`, '--no-daemon'],
        path.join(consumer, 'android')
      );
      console.log(
        `\nBuilt ${path.join(consumer, 'android/app/build/outputs/apk/release/app-release.apk')}`
      );
    } else {
      run('npx', ['expo', 'prebuild', '--clean', '--platform', 'ios'], consumer, {
        LANG: 'en_US.UTF-8',
      });
      const iosDir = path.join(consumer, 'ios');
      const workspace = fs.readdirSync(iosDir).find((file) => file.endsWith('.xcworkspace'));
      if (!workspace) throw new Error('Prebuild produced no Xcode workspace.');
      run(
        'xcodebuild',
        [
          '-workspace',
          workspace,
          '-scheme',
          workspace.replace(/\.xcworkspace$/, ''),
          '-configuration',
          'Release',
          '-sdk',
          'iphonesimulator',
          '-destination',
          'generic/platform=iOS Simulator',
          'CODE_SIGNING_ALLOWED=NO',
          'build',
        ],
        iosDir
      );
    }
    console.log('\nPackaged consumer gate passed.');
  } finally {
    if (args.keep) console.log(`Kept ${work}`);
    else fs.rmSync(work, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(`\nPackaged consumer gate failed: ${error.message}`);
  process.exit(1);
}
