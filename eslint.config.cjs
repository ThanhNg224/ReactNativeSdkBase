const { defineConfig } = require('eslint/config');
const universe = require('eslint-config-universe/flat/native');

const runtimeMessage = 'Not guaranteed under React Native/Hermes; see docs/STANDARD.md#runtime.';

module.exports = defineConfig([
  { ignores: ['build', 'temp', 'api-docs', 'etc', 'example'] },
  ...universe,
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['URL', 'URLSearchParams', 'TextDecoder', 'TextEncoder', 'crypto'].map((name) => ({
          name,
          message: runtimeMessage,
        })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'AbortSignal', property: 'timeout', message: runtimeMessage },
        { object: 'AbortSignal', property: 'any', message: runtimeMessage },
      ],
    },
  },
]);
