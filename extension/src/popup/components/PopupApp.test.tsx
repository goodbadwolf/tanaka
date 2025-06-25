import { render, fireEvent, waitFor } from '@testing-library/preact';
import { PopupApp } from './PopupApp';
import { resetPopupState, setLoadingState, setError } from '../../store/popup';
import { container } from '../../di/container';

describe('PopupApp', () => {
  let mockBrowser: {
    windows: {
      getCurrent: jest.Mock;
    };
    runtime: {
      sendMessage: jest.Mock;
      openOptionsPage: jest.Mock;
    };
    tabs: {
      create: jest.Mock;
    };
  };
  let mockWindow: {
    id: number | null;
    focused: boolean;
    incognito: boolean;
  };

  beforeEach(() => {
    // Reset popup state
    resetPopupState();

    // Setup mock window
    mockWindow = {
      id: 123,
      focused: true,
      incognito: false,
    };

    // Setup mock browser
    mockBrowser = {
      windows: {
        getCurrent: jest.fn().mockResolvedValue(mockWindow),
      },
      runtime: {
        openOptionsPage: jest.fn(),
        sendMessage: jest.fn().mockResolvedValue({ windowIds: [], titles: [] }),
      },
      tabs: {
        create: jest.fn(),
      },
    };

    // Register mock in DI container
    container.register('IBrowser', { useValue: mockBrowser });

    // Mock window.close
    global.window.close = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<PopupApp />);
    expect(getByText('Loading...')).toBeInTheDocument();
  });

  it('initializes popup on mount', async () => {
    render(<PopupApp />);

    await waitFor(() => {
      expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
    });

    await waitFor(() => {
      const title = document.querySelector('h1');
      const subtitle = document.querySelector('.subtitle');
      expect(title?.textContent).toBe('Tanaka');
      expect(subtitle?.textContent).toBe('Tab Synchronization');
    });
  });

  it('renders error state when initialization fails', async () => {
    mockBrowser.windows.getCurrent.mockRejectedValue(new Error('Failed to get window'));

    const { getByText } = render(<PopupApp />);

    await waitFor(() => {
      expect(getByText('Failed to get window')).toBeInTheDocument();
    });
  });

  it('renders error when window has no ID', async () => {
    mockBrowser.windows.getCurrent.mockResolvedValue({ id: null });

    const { getByText } = render(<PopupApp />);

    await waitFor(() => {
      expect(getByText('Unable to get current window')).toBeInTheDocument();
    });
  });

  it('renders WindowTracker component when initialized', async () => {
    const { container } = render(<PopupApp />);

    await waitFor(() => {
      expect(container.querySelector('.window-control')).toBeInTheDocument();
    });
  });

  it('opens settings page when settings link is clicked', async () => {
    const { getByText } = render(<PopupApp />);

    await waitFor(() => {
      expect(getByText('Settings')).toBeInTheDocument();
    });

    const settingsLink = getByText('Settings');
    fireEvent.click(settingsLink);

    expect(mockBrowser.runtime.openOptionsPage).toHaveBeenCalled();
    expect(window.close).toHaveBeenCalled();
  });

  it('uses computed signals for reactive updates', async () => {
    const { getByText, queryByText, rerender } = render(<PopupApp />);

    // Initially loading
    expect(getByText('Loading...')).toBeInTheDocument();

    // Simulate state change
    setLoadingState(false);
    setError('Test error');

    rerender(<PopupApp />);

    expect(queryByText('Loading...')).not.toBeInTheDocument();
    expect(getByText('Test error')).toBeInTheDocument();
  });

  it('prevents default on settings link click', async () => {
    const { getByText } = render(<PopupApp />);

    await waitFor(() => {
      expect(getByText('Settings')).toBeInTheDocument();
    });

    const settingsLink = getByText('Settings');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: false,
    });

    settingsLink.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
