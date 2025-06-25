export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.module\\.css$': '<rootDir>/src/test/__mocks__/identity-obj-proxy.js',
    '\\.css$': '<rootDir>/src/test/__mocks__/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@env$': '<rootDir>/src/test/__mocks__/@env.ts',
    '^preact/jsx-runtime$': '<rootDir>/node_modules/preact/jsx-runtime/dist/jsxRuntime.js',
    '^preact/hooks$': '<rootDir>/node_modules/preact/hooks/dist/hooks.js',
    '^preact/test-utils$': '<rootDir>/node_modules/preact/test-utils/dist/testUtils.js',
    '^preact$': '<rootDir>/node_modules/preact/dist/preact.js',
    '^@testing-library/preact$': '<rootDir>/node_modules/@testing-library/preact/dist/cjs/index.js',
    '^@preact/signals$': '<rootDir>/node_modules/.pnpm/@preact+signals@2.2.0_preact@10.26.9/node_modules/@preact/signals/dist/signals.js',
    '^@preact/signals-core$': '<rootDir>/node_modules/.pnpm/@preact+signals-core@1.10.0/node_modules/@preact/signals-core/dist/signals-core.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(preact|@preact|@testing-library|.*\\.mjs$))'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};