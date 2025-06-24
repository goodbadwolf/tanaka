import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock components
jest.mock('../components/PopupApp', () => ({
  PopupApp: () => 'PopupApp Component',
}));

// Mock preact
jest.mock('preact', () => ({
  render: jest.fn(),
}));

// Mock the debug import
jest.mock('preact/debug', () => ({}));

import { render } from 'preact';

describe('popup entry point', () => {
  const mockRender = render as jest.MockedFunction<typeof render>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document elements
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    jest.spyOn(document, 'getElementById').mockReturnValue(mockRootElement);
  });

  it('should render PopupApp to root element', async () => {
    // Import popup to trigger rendering
    await import('../popup');

    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(mockRender).toHaveBeenCalled();

    const renderCall = mockRender.mock.calls[0];
    expect((renderCall[1] as HTMLElement)?.id).toBe('root');
  });

  it('should handle missing root element gracefully', async () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    // Import should not throw even with null root
    await expect(import('../popup')).resolves.not.toThrow();
  });
});
