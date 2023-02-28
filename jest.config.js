/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: ['amdant.es6.js'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironment: 'node',
};

module.exports = config;
