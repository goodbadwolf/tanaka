import { Result, err, ok } from 'neverthrow';
import { ExtensionError } from '../error/types';
import { EXTENSION_PERMISSION_DENIED } from '../api/errors';
import type { IBrowser } from '../browser/core';
import { debugError, debugLog } from '../utils/logger';
import type { Manifest, Permissions } from 'webextension-polyfill';

export interface RequiredPermissions {
  permissions: string[];
  origins?: string[];
}

export class PermissionsService {
  private readonly requiredPermissions: RequiredPermissions = {
    permissions: ['tabs', 'storage'],
  };

  constructor(private readonly browser: IBrowser) {}

  /**
   * Check if all required permissions are granted
   */
  async checkPermissions(): Promise<Result<boolean, ExtensionError>> {
    try {
      const hasPermissions = await this.browser.permissions.contains(
        this.requiredPermissions as Permissions.Permissions,
      );

      if (!hasPermissions) {
        debugLog('Missing required permissions');
        return ok(false);
      }

      return ok(true);
    } catch (error) {
      debugError('Failed to check permissions', error);
      return err(
        new ExtensionError(EXTENSION_PERMISSION_DENIED, 'Failed to check permissions', {
          cause: error instanceof Error ? error : undefined,
          context: { operation: 'checkPermissions' },
        }),
      );
    }
  }

  /**
   * Get list of missing permissions
   */
  async getMissingPermissions(): Promise<Result<RequiredPermissions, ExtensionError>> {
    try {
      const granted = await this.browser.permissions.getAll();

      const missingPermissions = this.requiredPermissions.permissions.filter(
        (perm) => !granted.permissions?.includes(perm),
      );

      const missingOrigins = (this.requiredPermissions.origins ?? []).filter(
        (origin) => !granted.origins?.includes(origin),
      );

      return ok({
        permissions: missingPermissions,
        origins: missingOrigins.length > 0 ? missingOrigins : undefined,
      });
    } catch (error) {
      debugError('Failed to get missing permissions', error);
      return err(
        new ExtensionError(EXTENSION_PERMISSION_DENIED, 'Failed to get missing permissions', {
          cause: error instanceof Error ? error : undefined,
          context: { operation: 'getMissingPermissions' },
        }),
      );
    }
  }

  /**
   * Request missing permissions from the user
   */
  async requestPermissions(): Promise<Result<boolean, ExtensionError>> {
    try {
      const missingResult = await this.getMissingPermissions();

      if (missingResult.isErr()) {
        return err(missingResult.error);
      }

      const missing = missingResult.value;

      if (missing.permissions.length === 0 && (!missing.origins || missing.origins.length === 0)) {
        return ok(true);
      }

      // Cast to unknown first to satisfy TypeScript's strict type checking
      const permissionsRequest = {
        permissions: missing.permissions as unknown as (
          | Manifest.OptionalPermission
          | Manifest.OptionalOnlyPermission
        )[],
        origins: missing.origins,
      };
      const granted = await this.browser.permissions.request(permissionsRequest);

      return ok(granted);
    } catch (error) {
      debugError('Failed to request permissions', error);
      return err(
        new ExtensionError(EXTENSION_PERMISSION_DENIED, 'Failed to request permissions', {
          cause: error instanceof Error ? error : undefined,
          context: { operation: 'requestPermissions' },
        }),
      );
    }
  }

  /**
   * Check permissions and request if missing
   * This is a convenience method that combines check and request
   */
  async ensurePermissions(): Promise<Result<boolean, ExtensionError>> {
    const checkResult = await this.checkPermissions();

    if (checkResult.isErr()) {
      return checkResult;
    }

    if (checkResult.value) {
      return ok(true);
    }

    // Permissions are missing, try to request them
    return this.requestPermissions();
  }
}
