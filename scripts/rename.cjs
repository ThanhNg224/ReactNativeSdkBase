#!/usr/bin/env node
// Renames the template's package, native module, and Android package in one pass.
//
// Usage: npm run rename -- --name <npm-name> [--native-name <PascalName>]
//          [--android-package <java.package>] [--repo <owner/name>] [--title <Title>]
//
// Rewrites tracked and untracked (not ignored) text files, then moves the files
// whose paths carry the old names. Approved specs under docs/specs/ are decision
// history and are left untouched. The tool is one-shot: it removes itself, its
// test, its npm script, and the README's template section. Run `npm install`,
// `npm --prefix example install`, and `npm run api` afterwards.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const template = {
  name: 'react-native-sdk-base',
  nativeName: 'ReactNativeSdkBase',
  androidPackage: 'expo.modules.reactnativesdkbase',
  repo: 'ThanhNg224/ReactNativeSdkBase',
  title: 'React Native SDK Base',
};
const historyPrefix = 'docs/specs/';
const historyLink = 'docs/specs/2026-10-05-react-native-sdk-base-design.md';
const selfFiles = ['scripts/rename.cjs', 'test/rename.test.ts'];

function parseArgs(argv) {
  const args = { root: path.join(__dirname, '..') };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = argv[i + 1];
    if (!['name', 'nativeName', 'androidPackage', 'repo', 'title', 'root'].includes(key ?? '')) {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }
    if (value === undefined) throw new Error(`Missing value for ${argv[i]}`);
    args[key] = value;
  }
  if (!args.name || !/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(args.name)) {
    throw new Error('--name must be a valid lower-case npm package name');
  }
  const bare = args.name.replace(/^@[^/]+\//, '');
  const words = bare.split(/[-._~]+/).filter(Boolean);
  args.bare = bare;
  args.nativeName ??= words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  args.androidPackage ??= `expo.modules.${args.nativeName.toLowerCase()}`;
  args.title ??= words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  if (!/^[A-Z][A-Za-z0-9]*$/.test(args.nativeName)) {
    throw new Error('--native-name must be PascalCase letters and digits');
  }
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(args.androidPackage)) {
    throw new Error('--android-package must be a lower-case Java package, e.g. com.acme.sdk');
  }
  if (args.repo !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(args.repo)) {
    throw new Error('--repo must look like owner/name');
  }
  return args;
}

/** Ordered most-specific first so shorter tokens never clobber longer ones. */
function replacements(args) {
  const lower = args.nativeName.toLowerCase();
  const pairs = [
    [`${template.androidPackage}.example`, `${args.androidPackage}.example`],
    [template.androidPackage, args.androidPackage],
    [`${template.nativeName.toLowerCase()}example`, `${lower}example`],
    [`${template.name}-example`, `${args.bare}-example`],
    [`${template.name}-testing.api.md`, `${args.bare}-testing.api.md`],
    [`${template.name}.api.md`, `${args.bare}.api.md`],
  ];
  if (args.repo !== undefined) pairs.push([template.repo, args.repo]);
  pairs.push(
    [template.name, args.name],
    [template.nativeName, args.nativeName],
    [template.title, args.title]
  );
  return pairs;
}

function rewrite(text, pairs) {
  const guard = '\u0000HISTORY_LINK\u0000';
  let result = text.split(historyLink).join(guard);
  for (const [from, to] of pairs) result = result.split(from).join(to);
  return result.split(guard).join(historyLink);
}

/** Drops the parts that only make sense before the template is renamed. */
function removeTemplateOnly(file, text) {
  if (file === 'package.json')
    return text.replace(/^\s*"rename": "node scripts\/rename\.cjs",\n/m, '');
  if (file === 'README.md') {
    return text.replace(/<!-- template:start -->[\s\S]*?<!-- template:end -->\n*/g, '');
  }
  return text;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pairs = replacements(args);
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: args.root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(
      (file) =>
        file &&
        !file.startsWith(historyPrefix) &&
        !selfFiles.includes(file) &&
        fs.existsSync(path.join(args.root, file))
    );

  let changed = 0;
  for (const file of files) {
    const full = path.join(args.root, file);
    const buffer = fs.readFileSync(full);
    if (buffer.includes(0)) continue; // binary
    const text = buffer.toString('utf8');
    const next = removeTemplateOnly(file, rewrite(text, pairs));
    if (next !== text) {
      fs.writeFileSync(full, next);
      changed += 1;
    }
  }

  const androidFrom = `android/src/main/java/${template.androidPackage.replace(/\./g, '/')}`;
  const androidTo = `android/src/main/java/${args.androidPackage.replace(/\./g, '/')}`;
  const moves = [];
  for (const file of files) {
    let target = file.startsWith(`${androidFrom}/`)
      ? androidTo + file.slice(androidFrom.length)
      : file;
    target = rewrite(target, pairs);
    if (target !== file) moves.push([file, target]);
  }
  for (const [from, to] of moves) {
    fs.mkdirSync(path.dirname(path.join(args.root, to)), { recursive: true });
    fs.renameSync(path.join(args.root, from), path.join(args.root, to));
  }
  // Remove the emptied Android package directories.
  let dir = path.join(args.root, androidFrom);
  const javaRoot = path.join(args.root, 'android/src/main/java');
  while (
    dir.startsWith(javaRoot + path.sep) &&
    fs.existsSync(dir) &&
    fs.readdirSync(dir).length === 0
  ) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }

  for (const file of selfFiles) fs.rmSync(path.join(args.root, file), { force: true });

  console.log(`Renamed to ${args.name} (${args.nativeName}, ${args.androidPackage}).`);
  console.log(`Rewrote ${changed} files and moved ${moves.length}.`);
  if (args.repo === undefined)
    console.log(`Repository URLs still point to ${template.repo}; pass --repo to change them.`);
  console.log('Next: npm install && npm --prefix example install && npm run api && npm run verify');
}

try {
  main();
} catch (error) {
  console.error(`rename failed: ${error.message}`);
  process.exit(1);
}
