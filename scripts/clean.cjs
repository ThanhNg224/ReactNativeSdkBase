#!/usr/bin/env node
// Removes generated build, API-docs, and pack outputs; later builds recreate them.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
for (const target of ['build', 'temp', 'api-docs']) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
for (const file of fs.readdirSync(root)) {
  if (file.endsWith('.tgz')) fs.rmSync(path.join(root, file));
}
