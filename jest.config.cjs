/** Package tests run in plain Node: the core must not need React Native. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  // Source imports carry `.js` extensions for ESM; map them back to the `.ts` files.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
