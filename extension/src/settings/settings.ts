import browser from 'webextension-polyfill';
import { getConfig } from '../config/index.js';
import './settings.css';

const authTokenInput = document.getElementById('auth-token') as HTMLInputElement;
const saveAuthButton = document.getElementById('save-auth') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const serverInfoElement = document.getElementById('server-info') as HTMLParagraphElement;
const versionElement = document.getElementById('version') as HTMLSpanElement;

// Load current settings
async function loadSettings() {
  const settings = await browser.storage.local.get(['authToken']);
  authTokenInput.value = (settings.authToken as string) || '';

  // Show server URL
  serverInfoElement.textContent = `Connected to: ${getConfig().serverUrl}`;

  // Show version from manifest
  const manifest = browser.runtime.getManifest();
  versionElement.textContent = manifest.version;
}

// Save authentication
saveAuthButton.addEventListener('click', async () => {
  const authToken = authTokenInput.value.trim();

  if (!authToken) {
    showStatus('Auth token is required', 'error');
    return;
  }

  try {
    await browser.storage.local.set({ authToken });

    // Notify background script to reinitialize with new token
    await browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

    showStatus('Authentication saved successfully', 'success');
  } catch (error) {
    console.error('Error saving authentication:', error);
    showStatus('Failed to save authentication', 'error');
  }
});

function showStatus(message: string, type: 'success' | 'error') {
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Initialize
loadSettings();
