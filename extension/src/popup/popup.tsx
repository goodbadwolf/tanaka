import { ErrorInfo, render } from 'preact';
import 'reflect-metadata';
import { ErrorBoundary } from '../components/deprecated/ErrorBoundary';
import { DIProvider } from '../di/provider';
import { ExtensionError } from '../error/types';
import { PopupApp } from './components/PopupApp';
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
      <ErrorBoundary onError={handlePopupError} reportErrors={true}>
        <PopupApp />
      </ErrorBoundary>
    </DIProvider>,
    root,
  );
}
