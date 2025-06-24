import { jest } from '@jest/globals';
import {
  createMockWindowTracker,
  createMockSyncManager,
  createMockTabEventHandler,
  createMockUserSettingsManager,
  createMockMessageHandler,
} from '../test-utils/mock-factories';

export const WindowTracker = jest.fn().mockImplementation(() => createMockWindowTracker());
export const SyncManager = jest.fn().mockImplementation(() => createMockSyncManager());
export const TabEventHandler = jest.fn().mockImplementation(() => createMockTabEventHandler());
export const UserSettingsManager = jest
  .fn()
  .mockImplementation(() => createMockUserSettingsManager());
export const MessageHandler = jest.fn().mockImplementation(() => createMockMessageHandler());
