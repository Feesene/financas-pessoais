/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  testRegex: '\\.(spec|e2e-spec)\\.ts$',
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^@financas-pessoais/shared$': '<rootDir>/../shared/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
