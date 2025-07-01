import { render, screen, fireEvent } from '@testing-library/preact';
import { ExtensionError } from '../error/types';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ error }: { error?: Error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

// Component that uses the error handler hook
const ComponentWithErrorHandler = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  const handleError = useErrorHandler();

  if (shouldThrow) {
    handleError(new Error('Test error from hook'));
  }

  return <div>Component with error handler</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  const originalConsoleGroup = console.group;
  const originalConsoleGroupEnd = console.groupEnd;

  beforeEach(() => {
    console.error = jest.fn();
    console.info = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch and display ExtensionError', () => {
    const testError = new ExtensionError('NETWORK_FAILURE', 'Test network error', {
      source: 'test',
      severity: 'high',
      recoverable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test network error')).toBeInTheDocument();
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
  });

  it('should convert regular Error to ExtensionError', () => {
    const testError = new Error('Regular error');

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Component error: Regular error/)).toBeInTheDocument();
  });

  it('should show recovery actions when available', () => {
    const testError = new ExtensionError('AUTH_TOKEN_MISSING', 'Token missing', {
      source: 'test',
      recoveryActions: ['Check your settings', 'Re-enter your token'],
    });

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Suggested Actions:')).toBeInTheDocument();
    expect(screen.getByText('Check your settings')).toBeInTheDocument();
    expect(screen.getByText('Re-enter your token')).toBeInTheDocument();
  });

  it('should show error details when expanded', () => {
    const testError = new ExtensionError('DATABASE_ERROR', 'DB error', {
      source: 'test',
      context: { database: 'tabs.db' },
    });

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    // Click to expand error details
    fireEvent.click(screen.getByText('Error Details'));

    expect(screen.getByText('Error Code:')).toBeInTheDocument();
    expect(screen.getByText('DATABASE_ERROR')).toBeInTheDocument();
    expect(screen.getByText(/"database": "tabs.db"/)).toBeInTheDocument();
  });

  it('should handle retry functionality', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new ExtensionError('NETWORK_FAILURE', 'Network error', {
          recoverable: true,
        });
      }
      return <div>Success after retry</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Network error')).toBeInTheDocument();

    // Simulate fixing the error condition
    shouldThrow = false;

    // Click retry button
    fireEvent.click(screen.getByText(/Try Again/));

    // Component should re-render successfully
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Success after retry')).toBeInTheDocument();
  });

  it('should limit retry attempts', () => {
    const testError = new ExtensionError('NETWORK_FAILURE', 'Network error', {
      recoverable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    // Initial state should show 3 attempts left
    expect(screen.getByText(/3 attempts left/)).toBeInTheDocument();

    // Click retry multiple times
    fireEvent.click(screen.getByText(/Try Again/));
    fireEvent.click(screen.getByText(/Try Again/));
    fireEvent.click(screen.getByText(/Try Again/));

    // After 3 retries, button should be disabled or show different text
    const retryButtons = screen.queryAllByText(/Try Again/);
    expect(retryButtons).toHaveLength(0); // Should be disabled after max retries
  });

  it('should call custom onError handler', () => {
    const onError = jest.fn();
    const testError = new ExtensionError('SERVER_ERROR', 'Server error');

    // Suppress the console.error calls from the error boundary
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SERVER_ERROR',
        message: 'Server error',
      }),
      expect.any(Object) // Preact may not provide componentStack in the same way as React
    );

    consoleSpy.mockRestore();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: ExtensionError, retry: () => void) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    const testError = new ExtensionError('SYNC_CONFLICT', 'Sync conflict');

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Sync conflict')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('should report errors when enabled', () => {
    const testError = new ExtensionError('DATABASE_ERROR', 'DB error', {
      reportable: true,
    });

    // Mock console.info to capture the call
    const consoleInfoSpy = jest.spyOn(console, 'info');

    render(
      <ErrorBoundary reportErrors={true}>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '📊 Reporting error to telemetry:',
      expect.objectContaining({
        code: 'DATABASE_ERROR',
        message: 'DB error',
      })
    );

    consoleInfoSpy.mockRestore();
  });

  it('should not report errors when disabled', () => {
    const testError = new ExtensionError('DATABASE_ERROR', 'DB error', {
      reportable: true,
    });

    render(
      <ErrorBoundary reportErrors={false}>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining('Reporting error to telemetry')
    );
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass through props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

describe('useErrorHandler hook', () => {
  it('should throw ExtensionError that gets caught by boundary', () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render normally when not throwing', () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component with error handler')).toBeInTheDocument();
  });
});
