export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.module\\.css$': '<rootDir>/src/test/__mocks__/identity-obj-proxy.cjs',
    '\\.css$': '<rootDir>/src/test/__mocks__/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@env$': '<rootDir>/src/test/__mocks__/@env.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Current in a refactor mode so we don't need to test these
    '/src/components/',
    '/src/playground/components/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/test/**',
    '!src/test-utils/**',
    // UI Playground files
    '!src/playground-vue/**',
    // Mock and polyfill files
    '!src/browser/mock.ts',
    '!src/browser/mock-polyfill.ts',
    // Configuration files (just exports)
    '!src/config/environments/**',
    // Development-only utilities
    '!src/utils/performance.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70, // Reduced to allow for gradual improvement
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
