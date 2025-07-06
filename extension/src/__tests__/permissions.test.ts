import { PermissionsService } from '../services/permissions';
import { createMockBrowser } from '../browser/__mocks__';
import { EXTENSION_PERMISSION_DENIED } from '../api/errors';

describe('PermissionsService', () => {
  let browser: ReturnType<typeof createMockBrowser>;
  let service: PermissionsService;

  beforeEach(() => {
    browser = createMockBrowser();
    service = new PermissionsService(browser);
  });

  describe('checkPermissions', () => {
    it('should return true when all permissions are granted', async () => {
      browser.permissions.contains = jest.fn().mockResolvedValue(true);

      const result = await service.checkPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.contains).toHaveBeenCalledWith({
        permissions: ['tabs', 'storage'],
      });
    });

    it('should return false when permissions are missing', async () => {
      browser.permissions.contains = jest.fn().mockResolvedValue(false);

      const result = await service.checkPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should return error when permission check fails', async () => {
      const error = new Error('Permission API error');
      browser.permissions.contains = jest.fn().mockRejectedValue(error);

      const result = await service.checkPermissions();

      expect(result.isErr()).toBe(true);
      const err = result._unsafeUnwrapErr();
      expect(err.code).toBe(EXTENSION_PERMISSION_DENIED);
      expect(err.message).toBe('Failed to check permissions');
    });
  });

  describe('getMissingPermissions', () => {
    it('should return empty arrays when all permissions are granted', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage', 'other'],
        origins: [],
      });

      const result = await service.getMissingPermissions();

      expect(result.isOk()).toBe(true);
      const missing = result._unsafeUnwrap();
      expect(missing.permissions).toEqual([]);
      expect(missing.origins).toBeUndefined();
    });

    it('should return missing permissions', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'],
        origins: [],
      });

      const result = await service.getMissingPermissions();

      expect(result.isOk()).toBe(true);
      const missing = result._unsafeUnwrap();
      expect(missing.permissions).toEqual(['tabs']);
    });

    it('should handle error when getting permissions', async () => {
      const error = new Error('Permission API error');
      browser.permissions.getAll = jest.fn().mockRejectedValue(error);

      const result = await service.getMissingPermissions();

      expect(result.isErr()).toBe(true);
      const err = result._unsafeUnwrapErr();
      expect(err.code).toBe(EXTENSION_PERMISSION_DENIED);
    });
  });

  describe('requestPermissions', () => {
    it('should return true when permissions are already granted', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['tabs', 'storage'],
        origins: [],
      });

      const result = await service.requestPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).not.toHaveBeenCalled();
    });

    it('should propagate error from getMissingPermissions', async () => {
      const error = new Error('Permission API error');
      browser.permissions.getAll = jest.fn().mockRejectedValue(error);

      const result = await service.requestPermissions();

      expect(result.isErr()).toBe(true);
      const err = result._unsafeUnwrapErr();
      expect(err.code).toBe(EXTENSION_PERMISSION_DENIED);
      expect(browser.permissions.request).not.toHaveBeenCalled();
    });

    it('should request missing permissions', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'],
        origins: [],
      });
      browser.permissions.request = jest.fn().mockResolvedValue(true);

      const result = await service.requestPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).toHaveBeenCalledWith({
        permissions: ['tabs'],
        origins: undefined,
      });
    });

    it('should return false when user denies permission request', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'],
        origins: [],
      });
      browser.permissions.request = jest.fn().mockResolvedValue(false);

      const result = await service.requestPermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should handle error when requesting permissions', async () => {
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'],
        origins: [],
      });
      const error = new Error('User gesture required');
      browser.permissions.request = jest.fn().mockRejectedValue(error);

      const result = await service.requestPermissions();

      expect(result.isErr()).toBe(true);
      const err = result._unsafeUnwrapErr();
      expect(err.code).toBe(EXTENSION_PERMISSION_DENIED);
    });
  });

  describe('ensurePermissions', () => {
    it('should return true when permissions are already granted', async () => {
      browser.permissions.contains = jest.fn().mockResolvedValue(true);

      const result = await service.ensurePermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).not.toHaveBeenCalled();
    });

    it('should request permissions when missing', async () => {
      browser.permissions.contains = jest.fn().mockResolvedValue(false);
      browser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'],
        origins: [],
      });
      browser.permissions.request = jest.fn().mockResolvedValue(true);

      const result = await service.ensurePermissions();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(browser.permissions.request).toHaveBeenCalled();
    });

    it('should propagate check errors', async () => {
      const error = new Error('Permission API error');
      browser.permissions.contains = jest.fn().mockRejectedValue(error);

      const result = await service.ensurePermissions();

      expect(result.isErr()).toBe(true);
      const err = result._unsafeUnwrapErr();
      expect(err.code).toBe(EXTENSION_PERMISSION_DENIED);
    });
  });
});
