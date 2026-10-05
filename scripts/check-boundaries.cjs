#!/usr/bin/env node
// Enforces the import and state boundaries in docs/ARCHITECTURE.md.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const failures = [];

function walk(dir, extensions, skip = []) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skip.includes(entry.name)) files.push(...walk(full, extensions, skip));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(full);
    }
  }
  return files;
}

function specifiers(source) {
  const found = [];
  const pattern =
    /(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) found.push(match[1]);
  return found;
}

const relative = (file) => path.relative(root, file);
const nativeDir = path.join(root, 'src', 'internal', 'native') + path.sep;

for (const file of walk(path.join(root, 'src'), ['.ts', '.tsx'])) {
  const source = fs.readFileSync(file, 'utf8');
  for (const specifier of specifiers(source)) {
    if (specifier.startsWith('.')) continue;
    const allowed = specifier === 'expo' && file.startsWith(nativeDir);
    if (!allowed)
      failures.push(
        `${relative(file)}: imports '${specifier}' (src/ may import only relative paths; only src/internal/native/ may import 'expo')`
      );
  }
  if (/^\s*export\s+\*/m.test(source)) failures.push(`${relative(file)}: uses 'export *'`);
  if (/^\s*export\s+default\b/m.test(source))
    failures.push(`${relative(file)}: uses a default export`);
  if (/^(?:let|var)\s/m.test(source))
    failures.push(`${relative(file)}: declares mutable module-level state`);
}

const exampleRoot = path.join(root, 'example');
const exampleSkip = ['node_modules', 'android', 'ios', '.expo', 'dist'];
for (const file of walk(exampleRoot, ['.ts', '.tsx', '.js', '.jsx'], exampleSkip)) {
  if (
    [
      'metro.config.js',
      'babel.config.js',
      'jest.config.js',
      'jest.config.cjs',
      'babel.config.cjs',
    ].includes(path.basename(file))
  )
    continue;
  for (const specifier of specifiers(fs.readFileSync(file, 'utf8'))) {
    const deep =
      specifier.startsWith('react-native-sdk-base/') &&
      specifier !== 'react-native-sdk-base/testing';
    const intoPackage =
      specifier.startsWith('.') &&
      !path.resolve(path.dirname(file), specifier).startsWith(exampleRoot + path.sep);
    if (deep || intoPackage) {
      failures.push(
        `${relative(file)}: imports '${specifier}' (use 'react-native-sdk-base' or 'react-native-sdk-base/testing')`
      );
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Boundaries OK');
