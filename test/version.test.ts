import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sdkVersion } from '../src/index';

test('sdkVersion matches package.json', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as {
    version: string;
  };
  expect(sdkVersion).toBe(pkg.version);
});
