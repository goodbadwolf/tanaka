import 'reflect-metadata';
import { render, ComponentChildren, ErrorInfo } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import { Component } from 'preact';
import { DIProvider } from '../di/provider';
import { LoadingSpinner, ErrorMessage } from '../components';
import './settings.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Lazy load SettingsApp
const SettingsApp = lazy(() =>
  import('./components/SettingsApp').then((m) => ({ default: m.SettingsApp })),
);

// Error Boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ComponentChildren }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Settings app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <ErrorMessage
            message={`Failed to load settings: ${this.state.error?.message || 'Unknown error'}`}
            type="error"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const LoadingFallback = () => (
  <div className="loading-container">
    <LoadingSpinner size="large" />
    <p>Loading settings...</p>
  </div>
);

// Render the Preact app
const root = document.getElementById('root');
if (root) {
  render(
    <DIProvider>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <SettingsApp />
        </Suspense>
      </ErrorBoundary>
    </DIProvider>,
    root,
  );
}
