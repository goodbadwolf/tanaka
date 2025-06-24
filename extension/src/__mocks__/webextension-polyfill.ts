export default {
  windows: {
    getCurrent: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({
      version: '1.0.0',
    })),
  },
  tabs: {
    query: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
};
