// Mock webextension-polyfill for webapp mode
const mockBrowser = {
  tabs: {},
  windows: {},
  storage: { local: {} },
  runtime: {},
};

export default mockBrowser;
