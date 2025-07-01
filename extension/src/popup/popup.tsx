import 'reflect-metadata';
import { render, ErrorInfo } from 'preact';
import { PopupApp } from './components/PopupApp';
import { DIProvider } from '../di/provider';
import { ErrorBoundary } from '../components';
import { ExtensionError } from '../error/types';
import './popup.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Error handler for popup
const handlePopupError = (error: ExtensionError, errorInfo: ErrorInfo) => {
  console.error('Popup error:', {
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
      <ErrorBoundary
        onError={handlePopupError}
        reportErrors={true}
      >
        <PopupApp />
      </ErrorBoundary>
    </DIProvider>,
    root,
  );
}
