import { PermissionsService } from '../services/permissions';
import { createMockBrowser } from '../browser/__mocks__';
import type { Manifest } from 'webextension-polyfill';

describe('PermissionsService with origins', () => {
  let browser: ReturnType<typeof createMockBrowser>;
  let service: PermissionsService;

  beforeEach(() => {
    browser = createMockBrowser();
    // Create a service with custom required permissions including origins
    service = new PermissionsService(browser);
    // Override the requiredPermissions to include origins for testing
    // Override the requiredPermissions to include origins for testing
    Object.defineProperty(service, 'requiredPermissions', {
      value: {
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*', 'https://*.test.com/*'],
      },
      writable: false,
    });
  });

  describe('getMissingPermissions with origins', () => {
    it('should detect missing origins', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*'], // Missing test.com
      });

      const result = await service.getMissingPermissions();

      expect(result.isOk()).toBe(true);
      const missing = result._unsafeUnwrap();
      expect(missing.permissions).toEqual([]);
      expect(missing.origins).toEqual(['https://*.test.com/*']);
    });

    it('should return undefined origins when all are granted', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*', 'https://*.test.com/*'],
      });

      const result = await service.getMissingPermissions();

      expect(result.isOk()).toBe(true);
      const missing = result._unsafeUnwrap();
      expect(missing.permissions).toEqual([]);
      expect(missing.origins).toBeUndefined();
    });

    it('should handle both missing permissions and origins', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'], // Missing tabs
        origins: ['https://*.example.com/*'], // Missing test.com
      });

      const result = await service.getMissingPermissions();

      expect(result.isOk()).toBe(true);
      const missing = result._unsafeUnwrap();
      expect(missing.permissions).toEqual(['tabs']);
      expect(missing.origins).toEqual(['https://*.test.com/*']);
    });
  });

  describe('requestPermissions with origins', () => {
    it('should request missing origins', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*'], // Missing test.com
      });
      browser.permissions.request = jest.fn().mockResolvedValue(true);

      const result = await service.requestPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).toHaveBeenCalledWith({
        permissions: [] as (Manifest.OptionalPermission | Manifest.OptionalOnlyPermission)[],
        origins: ['https://*.test.com/*'],
      });
    });

    it('should return true when all permissions and origins are granted', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*', 'https://*.test.com/*'],
      });

      const result = await service.requestPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).not.toHaveBeenCalled();
    });
  });

  describe('checkPermissions with origins', () => {
    it('should check both permissions and origins', async () => {
      browser.permissions.contains = jest.fn().mockResolvedValue(true);

      const result = await service.checkPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.contains).toHaveBeenCalledWith({
        permissions: ['tabs', 'storage'],
        origins: ['https://*.example.com/*', 'https://*.test.com/*'],
      });
    });
  });
});
