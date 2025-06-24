import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/preact';
import { WindowTracker } from '../WindowTracker';

// Mock the hook
jest.mock('../../hooks/useWindowTracking', () => ({
  useWindowTracking: jest.fn(),
}));

import { useWindowTracking } from '../../hooks/useWindowTracking';

describe('WindowTracker', () => {
  const mockToggleTracking = jest.fn(() => Promise.resolve());
  const mockUseWindowTracking = jest.mocked(useWindowTracking);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render unchecked state when not tracked', () => {
    mockUseWindowTracking.mockReturnValue({
      isTracked: false,
      isLoading: false,
      error: null,
      toggleTracking: mockToggleTracking,
    });

    const { getByRole, getByText } = render(<WindowTracker />);

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(checkbox.disabled).toBe(false);

    expect(getByText('This window is not being synced')).toBeTruthy();
  });

  it('should render checked state when tracked', () => {
    mockUseWindowTracking.mockReturnValue({
      isTracked: true,
      isLoading: false,
      error: null,
      toggleTracking: mockToggleTracking,
    });

    const { getByRole, getByText } = render(<WindowTracker />);

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    expect(getByText('✓ This window is being synced')).toBeTruthy();
  });

  it('should disable checkbox when loading', () => {
    mockUseWindowTracking.mockReturnValue({
      isTracked: false,
      isLoading: true,
      error: null,
      toggleTracking: mockToggleTracking,
    });

    const { getByRole } = render(<WindowTracker />);

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('should display error message when error exists', () => {
    const errorMessage = 'Failed to connect';
    mockUseWindowTracking.mockReturnValue({
      isTracked: false,
      isLoading: false,
      error: errorMessage,
      toggleTracking: mockToggleTracking,
    });

    const { getByText } = render(<WindowTracker />);

    expect(getByText(`Error: ${errorMessage}`)).toBeTruthy();
  });

  it('should call toggleTracking when checkbox is clicked', () => {
    mockUseWindowTracking.mockReturnValue({
      isTracked: false,
      isLoading: false,
      error: null,
      toggleTracking: mockToggleTracking,
    });

    const { getByRole } = render(<WindowTracker />);

    const checkbox = getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggleTracking).toHaveBeenCalledTimes(1);
  });

  it('should have correct label text', () => {
    mockUseWindowTracking.mockReturnValue({
      isTracked: false,
      isLoading: false,
      error: null,
      toggleTracking: mockToggleTracking,
    });

    const { getByText } = render(<WindowTracker />);

    expect(getByText('Sync this window')).toBeTruthy();
  });
});
