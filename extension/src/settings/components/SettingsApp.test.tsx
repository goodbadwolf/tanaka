import { render, fireEvent, waitFor } from '@testing-library/preact';
import { SettingsApp } from './SettingsApp';
import { resetSettings, settings, setLoadingState, updateSettings } from '../../store/settings';
import { container } from '../../di/container';

// Mock the config module
jest.mock('../../config/index.js', () => ({
  getConfig: () => ({ serverUrl: 'https://test.tanaka.com' }),
}));

describe('SettingsApp', () => {
  let mockBrowser: {
    localStorage: {
      get: jest.Mock;
      set: jest.Mock;
    };
    runtime: {
      getManifest: jest.Mock;
      sendMessage: jest.Mock;
    };
  };
  let mockLocalStorage: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    // Reset settings state
    resetSettings();

    // Setup mock localStorage
    mockLocalStorage = {
      get: jest.fn().mockResolvedValue({
        authToken: 'test-token',
        syncInterval: 10000,
      }),
      set: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock browser
    mockBrowser = {
      localStorage: mockLocalStorage,
      runtime: {
        getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
        sendMessage: jest.fn().mockResolvedValue({ success: true }),
      },
    };

    // Register mock in DI container
    container.register('IBrowser', { useValue: mockBrowser });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    setLoadingState(true);
    const { getByText } = render(<SettingsApp />);
    expect(getByText('Loading settings...')).toBeInTheDocument();
  });

  it('loads settings on mount', async () => {
    const { getByLabelText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(mockLocalStorage.get).toHaveBeenCalledWith(['authToken', 'syncInterval']);
    });

    await waitFor(() => {
      const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
      expect(authTokenInput.value).toBe('test-token');

      const syncIntervalInput = getByLabelText('Sync Interval (seconds)') as HTMLInputElement;
      expect(syncIntervalInput.value).toBe('10');
    });
  });

  it.skip('saves settings on form submit', async () => {
    const { getByLabelText, getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
    const syncIntervalInput = getByLabelText('Sync Interval (seconds)') as HTMLInputElement;

    fireEvent.change(authTokenInput, { target: { value: 'new-token' } });
    fireEvent.change(syncIntervalInput, { target: { value: '30' } });

    const saveButton = getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockLocalStorage.set).toHaveBeenCalledWith({
        authToken: 'new-token',
        syncInterval: 30000,
      });
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SETTINGS_UPDATED',
      });
    });
  });

  it.skip('shows success message after saving', async () => {
    const { getByLabelText, getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
    fireEvent.change(authTokenInput, { target: { value: 'updated-token' } });

    const saveButton = getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(getByText('Settings saved successfully')).toBeInTheDocument();
    });
  });

  it.skip('validates empty auth token', async () => {
    const { getByLabelText, getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
    fireEvent.change(authTokenInput, { target: { value: '' } });

    const saveButton = getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(getByText('Auth token is required')).toBeInTheDocument();
    });
  });

  it.skip('shows loading state on save button when saving', async () => {
    // Delay the localStorage.set to see loading state
    mockLocalStorage.set.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { getByLabelText, getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
    fireEvent.change(authTokenInput, { target: { value: 'new-token' } });

    const saveButton = getByText('Save Settings');
    fireEvent.click(saveButton);

    // Button should show loading state
    expect(saveButton).toBeDisabled();
    expect(saveButton.querySelector('.loadingSpinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
      expect(saveButton.textContent).toBe('Save Settings');
    });
  });

  it('displays server information', async () => {
    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(getByText(/Connected to:/)).toBeInTheDocument();
    });
  });

  it('displays version information', () => {
    const { getByText } = render(<SettingsApp />);
    expect(getByText('Version 1.0.0')).toBeInTheDocument();
  });

  it.skip('handles load error', async () => {
    mockLocalStorage.get.mockRejectedValue(new Error('Failed to load'));

    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(getByText('Failed to load settings')).toBeInTheDocument();
    });
  });

  it('uses default value for unset token', async () => {
    mockLocalStorage.get.mockResolvedValue({
      authToken: 'unset-token',
      syncInterval: 5000,
    });

    const { getByLabelText } = render(<SettingsApp />);

    await waitFor(() => {
      const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
      expect(authTokenInput.value).toBe('');
    });
  });

  it('enables auto-persistence', async () => {
    render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    // Update the store to test auto-persistence
    updateSettings({ authToken: 'auto-saved', syncInterval: 15000 });

    await waitFor(() => {
      expect(mockLocalStorage.set).toHaveBeenCalledWith({
        authToken: 'auto-saved',
        syncInterval: 15000,
      });
    });
  });
});
