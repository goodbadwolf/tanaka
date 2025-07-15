/*
// Mock the browser global before any imports
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    permissions: {
      contains: jest.fn(),
      getAll: jest.fn(),
      request: jest.fn(),
      remove: jest.fn(),
      onAdded: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
      },
      onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
      },
    },
  },
}));

import browser from 'webextension-polyfill';
import { BrowserPermissions } from '../permissions';

// Get mocked browser for testing
const mockBrowser = browser as jest.Mocked<typeof browser>;

describe('BrowserPermissions', () => {
  let browserPermissions: BrowserPermissions;

  beforeEach(() => {
    jest.clearAllMocks();
    browserPermissions = new BrowserPermissions();
  });

  describe('contains', () => {
    it('should check if permissions are contained', async () => {
      const permissions = { permissions: ['tabs', 'storage'] };
      mockBrowser.permissions.contains.mockResolvedValue(true);

      const result = await browserPermissions.contains(permissions);

      expect(result).toBe(true);
      expect(mockBrowser.permissions.contains).toHaveBeenCalledWith(permissions);
    });

    it('should return false when permissions are not contained', async () => {
      const permissions = { permissions: ['tabs'] };
      mockBrowser.permissions.contains.mockResolvedValue(false);

      const result = await browserPermissions.contains(permissions);

      expect(result).toBe(false);
      expect(mockBrowser.permissions.contains).toHaveBeenCalledWith(permissions);
    });
  });

  describe('getAll', () => {
    it('should get all permissions', async () => {
      const allPermissions = {
        permissions: ['tabs', 'storage', 'cookies'],
        origins: ['https://*.example.com/*'],
      };
      mockBrowser.permissions.getAll.mockResolvedValue(allPermissions);

      const result = await browserPermissions.getAll();

      expect(result).toEqual(allPermissions);
      expect(mockBrowser.permissions.getAll).toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('should request permissions successfully', async () => {
      const permissions = { permissions: ['tabs'] };
      mockBrowser.permissions.request.mockResolvedValue(true);

      const result = await browserPermissions.request(permissions);

      expect(result).toBe(true);
      expect(mockBrowser.permissions.request).toHaveBeenCalledWith(permissions);
    });

    it('should return false when user denies permission request', async () => {
      const permissions = { permissions: ['tabs'] };
      mockBrowser.permissions.request.mockResolvedValue(false);

      const result = await browserPermissions.request(permissions);

      expect(result).toBe(false);
      expect(mockBrowser.permissions.request).toHaveBeenCalledWith(permissions);
    });
  });

  describe('remove', () => {
    it('should remove permissions successfully', async () => {
      const permissions = { permissions: ['tabs'] };
      mockBrowser.permissions.remove.mockResolvedValue(true);

      const result = await browserPermissions.remove(permissions);

      expect(result).toBe(true);
      expect(mockBrowser.permissions.remove).toHaveBeenCalledWith(permissions);
    });

    it('should return false when permission removal fails', async () => {
      const permissions = { permissions: ['tabs'] };
      mockBrowser.permissions.remove.mockResolvedValue(false);

      const result = await browserPermissions.remove(permissions);

      expect(result).toBe(false);
      expect(mockBrowser.permissions.remove).toHaveBeenCalledWith(permissions);
    });
  });

  describe('events', () => {
    it('should expose onAdded event', () => {
      expect(browserPermissions.onAdded).toBe(mockBrowser.permissions.onAdded);
    });

    it('should expose onRemoved event', () => {
      expect(browserPermissions.onRemoved).toBe(mockBrowser.permissions.onRemoved);
    });
  });
});
*/
