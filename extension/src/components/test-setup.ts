// Test setup for component tests
import '@testing-library/jest-dom';

// Mock CSS modules
jest.mock('*.module.css', () => {
  return new Proxy(
    {},
    {
      get: (_target, key) => {
        if (key === '__esModule') {
          return true;
        }
        return key;
      },
    },
  );
});
