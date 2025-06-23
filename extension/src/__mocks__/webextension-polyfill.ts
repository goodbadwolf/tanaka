export default {
  windows: {
    getCurrent: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
  },
};
