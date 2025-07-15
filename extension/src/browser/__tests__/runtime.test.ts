/*
import { BrowserRuntime } from '../runtime';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: jest.fn(),
    openOptionsPage: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
}));

describe('BrowserRuntime', () => {
  let runtime: BrowserRuntime;
  let mockBrowser: {
    runtime: {
      getManifest: jest.Mock;
      openOptionsPage: jest.Mock;
      sendMessage: jest.Mock;
      onMessage: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
        hasListener: jest.Mock;
      };
    };
  };
  beforeEach(() => {
    jest.clearAllMocks();
    runtime = new BrowserRuntime();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockBrowser = require('webextension-polyfill');
  });

  describe('getManifest', () => {
    it('should return manifest from browser API', () => {
      const mockManifest = {
        version: '1.0.0',
        name: 'Tanaka',
        description: 'Tab sync extension',
      };

      mockBrowser.runtime.getManifest.mockReturnValue(mockManifest);

      const result = runtime.getManifest();

      expect(mockBrowser.runtime.getManifest).toHaveBeenCalled();
      expect(result).toEqual(mockManifest);
    });
  });

  describe('openOptionsPage', () => {
    it('should call browser.runtime.openOptionsPage', async () => {
      mockBrowser.runtime.openOptionsPage.mockResolvedValue(undefined);

      await runtime.openOptionsPage();

      expect(mockBrowser.runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('should handle errors from openOptionsPage', async () => {
      const error = new Error('Failed to open options page');
      mockBrowser.runtime.openOptionsPage.mockRejectedValue(error);

      await expect(runtime.openOptionsPage()).rejects.toThrow(error);
    });
  });

  describe('sendMessage', () => {
    it('should send message via browser API', async () => {
      const message = { type: 'TEST_MESSAGE', data: 'test' };
      const response = { success: true };

      mockBrowser.runtime.sendMessage.mockResolvedValue(response);

      const result = await runtime.sendMessage(message);

      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(message);
      expect(result).toEqual(response);
    });

    it('should handle errors from sendMessage', async () => {
      const message = { type: 'TEST_MESSAGE' };
      const error = new Error('Failed to send message');

      mockBrowser.runtime.sendMessage.mockRejectedValue(error);

      await expect(runtime.sendMessage(message)).rejects.toThrow(error);
    });
  });

  describe('onMessage', () => {
    it('should expose browser.runtime.onMessage', () => {
      expect(runtime.onMessage).toBe(mockBrowser.runtime.onMessage);
    });
  });
});
*/
