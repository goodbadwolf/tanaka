import { render, fireEvent, waitFor } from '@testing-library/preact';
import { WindowTracker } from './WindowTracker';
import { trackedWindows, isWindowTracked } from '../../store/extension';
import { container } from '../../di/container';
import type { IBrowser } from '../../browser/core';

describe('WindowTracker', () => {
  let mockBrowser: any;
  let mockWindow: any;

  beforeEach(() => {
    // Reset tracked windows state
    trackedWindows.value = new Map();

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
        sendMessage: jest.fn(),
      },
    };

    // Register mock in DI container
    container.register('IBrowser', { useValue: mockBrowser });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<WindowTracker />);
    expect(getByText('Loading window status...')).toBeInTheDocument();
  });

  it('loads current window tracking status', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValue({
      windowIds: [123, 456],
      titles: ['Window 1', 'Window 2'],
    });

    const { getByText, getByRole } = render(<WindowTracker />);

    await waitFor(() => {
      expect(getByText('✓ This window is being synced')).toBeInTheDocument();
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(isWindowTracked(123)).toBe(true);
  });

  it('shows untracked status when window is not tracked', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValue({
      windowIds: [456],
      titles: ['Other Window'],
    });

    const { getByText, getByRole } = render(<WindowTracker />);

    await waitFor(() => {
      expect(getByText('This window is not being synced')).toBeInTheDocument();
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(isWindowTracked(123)).toBe(false);
  });

  it('handles tracking toggle', async () => {
    mockBrowser.runtime.sendMessage
      .mockResolvedValueOnce({ windowIds: [], titles: [] })
      .mockResolvedValueOnce({ success: true });

    const { getByRole } = render(<WindowTracker />);

    await waitFor(() => {
      const checkbox = getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(checkbox);

    // Check optimistic update
    expect(isWindowTracked(123)).toBe(true);

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'TRACK_WINDOW',
        windowId: 123,
      });
    });
  });

  it('handles untracking toggle', async () => {
    mockBrowser.runtime.sendMessage
      .mockResolvedValueOnce({ windowIds: [123], titles: ['Window 1'] })
      .mockResolvedValueOnce({ success: true });

    const { getByRole } = render(<WindowTracker />);

    await waitFor(() => {
      const checkbox = getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(checkbox);

    // Check optimistic update
    expect(isWindowTracked(123)).toBe(false);

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UNTRACK_WINDOW',
        windowId: 123,
      });
    });
  });

  it('reverts on error and shows error message', async () => {
    mockBrowser.runtime.sendMessage
      .mockResolvedValueOnce({ windowIds: [], titles: [] })
      .mockResolvedValueOnce({ error: 'Failed to track window' });

    const { getByRole, getByText } = render(<WindowTracker />);

    await waitFor(() => {
      const checkbox = getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(getByText('Error: Failed to track window')).toBeInTheDocument();
      expect(isWindowTracked(123)).toBe(false);
    });
  });

  it('handles window without ID', async () => {
    mockBrowser.windows.getCurrent.mockResolvedValue({ id: null });

    const { getByText } = render(<WindowTracker />);

    await waitFor(() => {
      expect(getByText('Error: Current window has no ID')).toBeInTheDocument();
    });
  });

  it('handles initialization error', async () => {
    mockBrowser.runtime.sendMessage.mockRejectedValue(new Error('Connection failed'));

    const { getByText } = render(<WindowTracker />);

    await waitFor(() => {
      expect(getByText('Error: Connection failed')).toBeInTheDocument();
    });
  });

  it('disables checkbox when no window ID', async () => {
    mockBrowser.windows.getCurrent.mockResolvedValue({ id: null });

    const { getByRole } = render(<WindowTracker />);

    await waitFor(() => {
      const checkbox = getByRole('checkbox') as HTMLInputElement;
      expect(checkbox).toBeDisabled();
    });
  });
});