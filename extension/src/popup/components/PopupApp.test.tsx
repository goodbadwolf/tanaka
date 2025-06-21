import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import { PopupApp } from './PopupApp';

vi.mock('webextension-polyfill', () => ({
  default: {
    windows: {
      getCurrent: vi.fn().mockResolvedValue({ id: 1 }),
    },
  },
}));

describe('PopupApp', () => {
  it('should render loading state initially', () => {
    render(<PopupApp />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render title', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('Tanaka')).toBeInTheDocument();
    });
  });

  it('should render subtitle after loading', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('Tab Synchronization')).toBeInTheDocument();
    });
  });
});