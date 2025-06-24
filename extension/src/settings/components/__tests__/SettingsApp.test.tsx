import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render } from '@testing-library/preact';
import { SettingsApp } from '../SettingsApp';

// Mock hooks
jest.mock('../../hooks/useSettings', () => ({
  useSettings: jest.fn(() => ({
    authToken: 'test-token',
    isSaving: false,
    saveStatus: null,
    saveAuthToken: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../../config/index', () => ({
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
    const { container } = render(<SettingsApp />);
    expect(container.querySelector('.container')).toBeTruthy();
  });

  it('should display version from manifest', () => {
    const { getByText } = render(<SettingsApp />);
    expect(getByText(/Version 1\.0\.0/)).toBeTruthy();
  });

  it('should display server URL from config', () => {
    const { getByText } = render(<SettingsApp />);
    expect(getByText('https://test.server.com')).toBeTruthy();
  });

  it('should display title', () => {
    const { getByText } = render(<SettingsApp />);
    expect(getByText('Tanaka Settings')).toBeTruthy();
  });
});
