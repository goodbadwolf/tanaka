import tsJestPreset from 'ts-jest/presets/default-esm/jest-preset.js';

export default {
  ...tsJestPreset,
  testEnvironment: 'jsdom',
  transform: {
    ...tsJestPreset.transform,
    '^.+\\.m?[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: true
    }]
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
      diagnostics: false
    }
  },
  moduleNameMapper: {
    '^preact/jsx-runtime$': '<rootDir>/node_modules/preact/jsx-runtime/dist/jsxRuntime.js',
    '^@testing-library/preact$': '<rootDir>/node_modules/@testing-library/preact/dist/cjs/index.js',
    '^@testing-library/preact/pure$': '<rootDir>/node_modules/@testing-library/preact/dist/cjs/pure.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/test/__mocks__/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@env$': '<rootDir>/src/test/__mocks__/@env.ts',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:.*preact)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
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