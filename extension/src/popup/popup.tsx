import { render } from 'preact';
import { PopupApp } from './components/PopupApp';
import './popup.css';

// Render the Preact app
render(<PopupApp />, document.getElementById('root')!);