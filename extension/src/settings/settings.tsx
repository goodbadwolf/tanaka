import { render } from 'preact';
import { SettingsApp } from './components/SettingsApp';
import './settings.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Render the Preact app
render(<SettingsApp />, document.getElementById('root')!);