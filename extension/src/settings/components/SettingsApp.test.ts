import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SettingsApp } from './SettingsApp';

// Mock hooks
jest.mock('../hooks/useSettings', () => ({
  useSettings: jest.fn(() => ({
    authToken: 'test-token',
    isSaving: false,
    saveStatus: null,
    saveAuthToken: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config/index.js', () => ({
  getConfig: jest.fn(() => ({
    serverUrl: 'https://test.server.com',
  })),
}));

// Mock browser
jest.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: jest.fn(() => ({
      version: '1.0.0',
    })),
  },
}));

describe('SettingsApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render successfully', () => {
    const result = SettingsApp();
    expect(result).toBeTruthy();
  });

  it('should display version from manifest', () => {
    const result = SettingsApp();
    const versionElement = result.props.children[0].props.children[1];
    expect(versionElement.props.children).toContain('Version ');
    expect(versionElement.props.children).toContain('1.0.0');
  });

  it('should display server URL from config', () => {
    const result = SettingsApp();
    const main = result.props.children[1];
    const serverInfo = main.props.children[1];
    const serverInfoText = serverInfo.props.children[1];
    expect(serverInfoText.props.children).toContain('Connected to: ');
    expect(serverInfoText.props.children).toContain('https://test.server.com');
  });

  it('should render auth token input with default value', () => {
    const result = SettingsApp();
    const main = result.props.children[1];
    const authSection = main.props.children[0];
    const form = authSection.props.children[1];
    const formGroup = form.props.children[0];
    const input = formGroup.props.children[1];

    expect(input.props.type).toBe('password');
    expect(input.props.defaultValue).toBe('test-token');
    expect(input.props.disabled).toBe(false);
  });

  it('should disable input and button when saving', () => {
    const { useSettings } = jest.requireMock('../hooks/useSettings') as unknown as {
      useSettings: jest.MockedFunction<typeof import('../hooks/useSettings').useSettings>;
    };
    useSettings.mockReturnValue({
      authToken: 'test-token',
      isSaving: true,
      saveStatus: null,
      saveAuthToken: jest.fn(() => Promise.resolve()),
    });

    const result = SettingsApp();
    const main = result.props.children[1];
    const authSection = main.props.children[0];
    const form = authSection.props.children[1];
    const input = form.props.children[0].props.children[1];
    const button = form.props.children[1];

    expect(input.props.disabled).toBe(true);
    expect(button.props.disabled).toBe(true);
    expect(button.props.children).toBe('Saving...');
  });

  it('should display success status message', () => {
    const { useSettings } = jest.requireMock('../hooks/useSettings') as unknown as {
      useSettings: jest.MockedFunction<typeof import('../hooks/useSettings').useSettings>;
    };
    useSettings.mockReturnValue({
      authToken: 'test-token',
      isSaving: false,
      saveStatus: {
        type: 'success',
        message: 'Authentication saved successfully',
      },
      saveAuthToken: jest.fn(() => Promise.resolve()),
    });

    const result = SettingsApp();
    const main = result.props.children[1];
    const authSection = main.props.children[0];
    const statusMessage = authSection.props.children[2];

    expect(statusMessage.props.className).toBe('status-message success');
    expect(statusMessage.props.children).toBe('Authentication saved successfully');
  });

  it('should display error status message', () => {
    const { useSettings } = jest.requireMock('../hooks/useSettings') as unknown as {
      useSettings: jest.MockedFunction<typeof import('../hooks/useSettings').useSettings>;
    };
    useSettings.mockReturnValue({
      authToken: 'test-token',
      isSaving: false,
      saveStatus: {
        type: 'error',
        message: 'Failed to save authentication',
      },
      saveAuthToken: jest.fn(() => Promise.resolve()),
    });

    const result = SettingsApp();
    const main = result.props.children[1];
    const authSection = main.props.children[0];
    const statusMessage = authSection.props.children[2];

    expect(statusMessage.props.className).toBe('status-message error');
    expect(statusMessage.props.children).toBe('Failed to save authentication');
  });
});
