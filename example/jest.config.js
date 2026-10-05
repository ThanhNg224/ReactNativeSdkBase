module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^react-native-sdk-base$': '<rootDir>/../src/index.ts',
    '^react-native-sdk-base/testing$': '<rootDir>/../src/testing.ts',
    // The SDK sources use explicit `.js` specifiers that point at `.ts` files.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Make SDK sources resolve the example's own copy of `expo`.
    '^expo$': '<rootDir>/node_modules/expo',
  },
};
