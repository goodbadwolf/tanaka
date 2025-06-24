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

describe('popup entry point', () => {
  let mockRender: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document elements
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    jest.spyOn(document, 'getElementById').mockReturnValue(mockRootElement);
    
    // Get mocked render
    const preact = jest.requireMock('preact');
    mockRender = preact.render as jest.MockedFunction<any>;
  });

  it('should render PopupApp to root element', async () => {
    // Import popup to trigger rendering
    await import('../popup');

    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(mockRender).toHaveBeenCalled();
    
    const renderCall = mockRender.mock.calls[0];
    expect(renderCall[1]?.id).toBe('root');
  });

  it('should handle missing root element gracefully', async () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    
    // Import should not throw even with null root
    await expect(import('../popup')).resolves.not.toThrow();
  });
});