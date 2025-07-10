import { ErrorInfo, render } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import 'reflect-metadata';
import { ErrorBoundary } from '../components/deprecated/ErrorBoundary';
import { LoadingSpinner } from '../components/deprecated/LoadingSpinner';
import { DIProvider } from '../di/provider';
import { ExtensionError } from '../error/types';
import './settings.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Lazy load SettingsApp
const SettingsApp = lazy(() =>
  import('./components/SettingsApp').then((m) => ({ default: m.SettingsApp })),
);

// Loading component
const LoadingFallback = () => (
  <div className="loading-container">
    <LoadingSpinner size="large" />
    <p>Loading settings...</p>
  </div>
);

// Error handler for settings page
const handleSettingsError = (error: ExtensionError, errorInfo: ErrorInfo) => {
  console.error('Settings page error:', {
    errorId: error.id,
    code: error.code,
    message: error.message,
    componentStack: errorInfo.componentStack,
  });
};

// Render the Preact app
const root = document.getElementById('root');
if (root) {
  render(
    <DIProvider>
      <ErrorBoundary onError={handleSettingsError} reportErrors={true}>
        <Suspense fallback={<LoadingFallback />}>
          <SettingsApp />
        </Suspense>
      </ErrorBoundary>
    </DIProvider>,
    root,
  );
}
