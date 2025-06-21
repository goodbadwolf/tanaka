import { render } from 'preact';
import { SettingsApp } from './components/SettingsApp';
import './settings.css';

// Render the Preact app
render(<SettingsApp />, document.getElementById('root')!);