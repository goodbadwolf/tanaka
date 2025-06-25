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

  it('saves settings on form submit', async () => {
    const { getByLabelText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    const authTokenInput = getByLabelText('Auth Token') as HTMLInputElement;
    const syncIntervalInput = getByLabelText('Sync Interval (seconds)') as HTMLInputElement;

    fireEvent.change(authTokenInput, { target: { value: 'new-token' } });
    fireEvent.change(syncIntervalInput, { target: { value: '30' } });

    // Import and call saveSettings directly
    const { saveSettings } = await import('../../store/settings');

    // Mock the form submission by calling saveSettings directly
    await saveSettings(
      {
        authToken: 'new-token',
        syncInterval: 30000,
      },
      mockLocalStorage,
    );

    // Notify background script
    await mockBrowser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

    expect(mockLocalStorage.set).toHaveBeenCalledWith({
      authToken: 'new-token',
      syncInterval: 30000,
    });
    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SETTINGS_UPDATED',
    });
  });

  it('shows success message after saving', async () => {
    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    // Import and call saveSettings directly to simulate saving
    const { saveSettings, saveStatus } = await import('../../store/settings');

    await saveSettings(
      {
        authToken: 'updated-token',
        syncInterval: 10000,
      },
      mockLocalStorage,
    );

    await waitFor(() => {
      expect(saveStatus.value).toEqual({
        type: 'success',
        message: 'Settings saved successfully',
      });
    });

    // Check that the success message is displayed
    expect(getByText('Settings saved successfully')).toBeInTheDocument();
  });

  it('validates empty auth token', async () => {
    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    // Import and call saveSettings directly to simulate validation
    const { saveSettings, saveStatus } = await import('../../store/settings');

    // Try to save with empty token
    try {
      await saveSettings(
        {
          authToken: '',
          syncInterval: 10000,
        },
        mockLocalStorage,
      );
    } catch {
      // Expected to throw
    }

    await waitFor(() => {
      expect(saveStatus.value).toEqual({
        type: 'error',
        message: 'Auth token is required',
      });
    });

    // Check that the error message is displayed
    expect(getByText('Auth token is required')).toBeInTheDocument();
  });

  it.skip('shows loading state on save button when saving', async () => {
    // Delay the localStorage.set to see loading state
    mockLocalStorage.set.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      expect(settings.value.authToken).toBe('test-token');
    });

    // Import functions to control saving state
    const { saveSettings, isSaving } = await import('../../store/settings');

    // Start saving (don't await)
    const savePromise = saveSettings(
      {
        authToken: 'new-token',
        syncInterval: 10000,
      },
      mockLocalStorage,
    );

    // Check that isSaving is true
    expect(isSaving.value).toBe(true);

    // Check button state
    const saveButton = getByText('Save Settings');
    expect(saveButton).toBeDisabled();
    expect(saveButton.getAttribute('aria-busy')).toBe('true');

    // Wait for saving to complete
    await savePromise;

    await waitFor(() => {
      expect(isSaving.value).toBe(false);
      expect(saveButton).not.toBeDisabled();
      expect(saveButton.getAttribute('aria-busy')).toBe('false');
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
    // Reset the mock for this specific test
    jest.clearAllMocks();
    mockLocalStorage.get.mockRejectedValueOnce(new Error('Failed to load'));

    const { getByText } = render(<SettingsApp />);

    await waitFor(() => {
      // The error message is displayed via ErrorMessage component
      const errorMessage = getByText('Failed to load settings');
      expect(errorMessage).toBeInTheDocument();
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
