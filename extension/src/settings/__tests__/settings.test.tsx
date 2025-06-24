import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock components
jest.mock('../components/SettingsApp', () => ({
  SettingsApp: () => 'SettingsApp Component',
}));

// Mock preact
jest.mock('preact', () => ({
  render: jest.fn(),
}));

// Mock the debug import
jest.mock('preact/debug', () => ({}));

import { render } from 'preact';

describe('settings entry point', () => {
  const mockRender = render as jest.MockedFunction<typeof render>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document elements
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    jest.spyOn(document, 'getElementById').mockReturnValue(mockRootElement);
  });

  it('should render SettingsApp to root element', async () => {
    // Import settings to trigger rendering
    await import('../settings');

    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(mockRender).toHaveBeenCalled();

    const renderCall = mockRender.mock.calls[0];
    expect((renderCall[1] as HTMLElement)?.id).toBe('root');
  });

  it('should handle missing root element gracefully', async () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    // Import should not throw even with null root
    await expect(import('../settings')).resolves.not.toThrow();
  });
});
