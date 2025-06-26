import 'reflect-metadata';
import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { webappContainer } from '../di/webapp-container';
import { PopupApp } from '../popup/components/PopupApp';
import { SettingsApp } from '../settings/components/SettingsApp';
import { DIProvider } from '../di/provider';
import '../popup/popup.css';
import '../settings/settings.css';

// Load Preact DevTools
if (process.env.NODE_ENV === 'development') {
  import('preact/debug');
}

function WebApp() {
  return (
    <DIProvider container={webappContainer}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <nav style={{ 
          backgroundColor: 'white', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1rem'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Tanaka Webapp</h1>
            <a href="/" style={{ alignSelf: 'center' }}>Popup</a>
            <a href="/settings" style={{ alignSelf: 'center' }}>Settings</a>
          </div>
        </nav>
        
        <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          <Router>
            <Route path="/" component={PopupView} />
            <Route path="/settings" component={SettingsView} />
          </Router>
        </main>
      </div>
    </DIProvider>
  );
}

function PopupView() {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      width: '400px',
      margin: '0 auto'
    }}>
      <PopupApp />
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '2rem'
    }}>
      <SettingsApp />
    </div>
  );
}

// Render the webapp
const root = document.getElementById('root');
if (root) {
  render(<WebApp />, root);
}