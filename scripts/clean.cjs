#!/usr/bin/env node
// Removes generated outputs; every later build recreates them.
//
//   node scripts/clean.cjs        build/, API Extractor temp/, api-docs/, *.tgz
//   node scripts/clean.cjs --all  also the example's generated native projects,
//                                 Expo caches, and native build output that Gradle
//                                 writes inside node_modules (dependencies stay)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const all = process.argv.includes('--all');
const remove = (target) => fs.rmSync(path.join(root, target), { recursive: true, force: true });

for (const target of ['build', 'temp', 'api-docs']) remove(target);
for (const file of fs.readdirSync(root)) {
  if (file.endsWith('.tgz')) remove(file);
}

if (all) {
  for (const target of ['example/android', 'example/ios', 'example/.expo', 'example/dist']) {
    remove(target);
  }
  for (const modules of ['node_modules', 'example/node_modules']) {
    const dir = path.join(root, modules);
    if (!fs.existsSync(dir)) continue;
    const directories = (parent) =>
      fs
        .readdirSync(parent, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name);
    const packages = directories(dir).flatMap((name) =>
      name.startsWith('@')
        ? directories(path.join(dir, name)).map((scoped) => path.join(name, scoped))
        : [name]
    );
    for (const pkg of packages) {
      for (const output of ['android/build', 'android/.cxx']) {
        remove(path.join(modules, pkg, output));
      }
    }
  }
}
