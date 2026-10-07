const js = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');

const runtimeMessage = 'Not guaranteed under React Native/Hermes; see docs/STANDARD.md#runtime.';

// Formatting is Prettier's job (`npm run format:check`); ESLint covers correctness.
module.exports = defineConfig([
  {
    ignores: [
      'build',
      'temp',
      'api-docs',
      'etc',
      'example/node_modules',
      'example/android',
      'example/ios',
      'example/.expo',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.cjs', 'example/*.js', 'example/plugins/*.js'],
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
    rules: { '@typescript-eslint/no-require-imports': 'off' },
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
