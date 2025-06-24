import { render } from 'preact';
import { PopupApp } from './components/PopupApp';
import './popup.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Render the Preact app
render(<PopupApp />, document.getElementById('root')!);