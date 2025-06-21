import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
            importSource: 'preact',
          },
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(preact|@testing-library)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^react/jsx-runtime$': 'preact/jsx-runtime',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
    '@testing-library/preact': '<rootDir>/src/__mocks__/@testing-library/preact.tsx',
    '^preact/hooks$': '<rootDir>/src/__mocks__/preact/hooks.ts',
    '^preact/compat$': '<rootDir>/src/__mocks__/preact/compat.ts',
    '^preact/jsx-runtime$': '<rootDir>/src/__mocks__/preact/jsx-runtime.ts',
    '^preact$': '<rootDir>/src/__mocks__/preact.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
  ],
};

export default config;