import { Component, ComponentChildren, ErrorInfo } from 'preact';
import { ErrorFactories, ExtensionError, isExtensionError } from '../../error/types';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';

export interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: (error: ExtensionError, retry: () => void) => ComponentChildren;
  onError?: (error: ExtensionError, errorInfo: ErrorInfo) => void;
  reportErrors?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: ExtensionError;
  errorId?: string;
}

/**
 * Enhanced Error Boundary that integrates with our ExtensionError system
 *
 * Features:
 * - Converts unknown errors to ExtensionError
 * - Provides retry functionality
 * - Supports custom fallback UI
 * - Logs errors with context
 * - Integrates with error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Store the original error for componentDidCatch to handle conversion
    return {
      hasError: true,
      error: error as ExtensionError, // Will be properly converted in componentDidCatch
      errorId: crypto.randomUUID(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Convert any error to ExtensionError if it's not already one
    const extensionError = isExtensionError(error)
      ? error
      : new ExtensionError('BROWSER_API_UNAVAILABLE', `Component error: ${error.message}`, {
          source: 'ui',
          severity: 'high',
          recoverable: true,
          cause: error,
          context: {
            componentStack: errorInfo.componentStack,
          },
        });

    // Update state with the properly converted error
    this.setState({
      hasError: true,
      error: extensionError,
      errorId: extensionError.id,
    });

    // Enhanced error logging with context
    console.group(`🚨 Error Boundary Caught Error (${extensionError.id})`);
    console.error('Error:', error);
    console.error('Error Code:', extensionError.code);
    console.error('Severity:', extensionError.severity);
    console.error('Recoverable:', extensionError.recoverable);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(extensionError, errorInfo);
    }

    // Report error if enabled and reportable
    if (this.props.reportErrors !== false && extensionError.reportable) {
      this.reportError(extensionError, errorInfo);
    }
  }

  private reportError = (error: ExtensionError, errorInfo: ErrorInfo) => {
    // In a real implementation, this would send to error reporting service
    console.info('📊 Reporting error to telemetry:', {
      errorId: error.id,
      code: error.code,
      message: error.message,
      severity: error.severity,
      componentStack: errorInfo.componentStack,
      timestamp: error.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  private handleRetry = () => {
    if (this.retryCount >= this.maxRetries) {
      console.warn(`Max retries (${this.maxRetries}) reached for error ${this.state.errorId}`);
      return;
    }

    this.retryCount++;
    console.info(`🔄 Retrying component (attempt ${this.retryCount}/${this.maxRetries})`);

    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private renderDefaultFallback = (error: ExtensionError) => {
    const canRetry = error.recoverable && this.retryCount < this.maxRetries;
    const showRecoveryActions = error.recoveryActions && error.recoveryActions.length > 0;

    return (
      <div className="error-boundary-fallback">
        <ErrorMessage
          type="error"
          title="Something went wrong"
          message={error.message}
          dismissible={false}
        />

        <div className="error-details">
          <details>
            <summary>Error Details</summary>
            <div className="error-info">
              <p>
                <strong>Error ID:</strong> {error.id}
              </p>
              <p>
                <strong>Error Code:</strong> {error.code}
              </p>
              <p>
                <strong>Severity:</strong> {error.severity}
              </p>
              <p>
                <strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}
              </p>
              {error.context && (
                <div>
                  <strong>Context:</strong>
                  <pre>{JSON.stringify(error.context, null, 2)}</pre>
                </div>
              )}
            </div>
          </details>
        </div>

        {showRecoveryActions && (
          <div className="recovery-actions">
            <h4>Suggested Actions:</h4>
            <ul>
              {error.recoveryActions!.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="error-actions">
          {canRetry && (
            <Button variant="primary" onClick={this.handleRetry} size="small">
              {`Try Again (${this.maxRetries - this.retryCount} attempts left)`}
            </Button>
          )}

          <Button variant="secondary" onClick={this.handleReset} size="small">
            Reset Component
          </Button>

          <Button variant="secondary" onClick={() => window.location.reload()} size="small">
            Reload Page
          </Button>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return this.renderDefaultFallback(this.state.error);
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: (props: P) => ComponentChildren,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for triggering error boundary from within components
 */
export function useErrorHandler() {
  return (error: Error | ExtensionError) => {
    // Convert to ExtensionError if needed
    const extensionError = isExtensionError(error)
      ? error
      : ErrorFactories.browserApiUnavailable('Component');

    // Throw the error to be caught by error boundary
    throw extensionError;
  };
}
