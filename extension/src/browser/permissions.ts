import browser, { type Permissions } from 'webextension-polyfill';
import type { IPermissions } from './core';

export class BrowserPermissions implements IPermissions {
  contains(permissions: Permissions.Permissions): Promise<boolean> {
    return browser.permissions.contains(permissions);
  }

  getAll(): Promise<Permissions.AnyPermissions> {
    return browser.permissions.getAll();
  }

  request(permissions: Permissions.Permissions): Promise<boolean> {
    return browser.permissions.request(permissions);
  }

  remove(permissions: Permissions.Permissions): Promise<boolean> {
    return browser.permissions.remove(permissions);
  }

  readonly onAdded = browser.permissions.onAdded;
  readonly onRemoved = browser.permissions.onRemoved;
}
