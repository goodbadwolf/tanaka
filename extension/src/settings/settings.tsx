import 'reflect-metadata';
import { render } from 'preact';
import { SettingsApp } from './components/SettingsApp';
import { DIProvider } from '../di/provider';
import './settings.css';

// Load Preact DevTools in development
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

// Render the Preact app
const root = document.getElementById('root');
if (root) {
  render(
    <DIProvider>
      <SettingsApp />
    </DIProvider>,
    root,
  );
}
