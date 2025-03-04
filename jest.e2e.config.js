module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 30000, // Increase timeout for E2E tests
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  // rootDir: 'src'
}; 