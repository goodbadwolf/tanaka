import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from './core.js';

const trackWindowCheckbox = document.getElementById('track-window') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const serverUrlInput = document.getElementById('server-url') as HTMLInputElement;
const serverTokenInput = document.getElementById('server-token') as HTMLInputElement;
const saveConfigButton = document.getElementById('save-config') as HTMLButtonElement;

// Get current window tracking status
async function updateUI() {
  const currentWindow = await browser.windows.getCurrent();
  if (!currentWindow.id) {
    console.error('Current window has no ID');
    return;
  }

  const message: Message = { type: 'GET_TRACKED_WINDOWS' };
  const response = (await browser.runtime.sendMessage(message)) as MessageResponse;

  if ('windowIds' in response) {
    trackWindowCheckbox.checked = response.windowIds.includes(currentWindow.id);
  } else if ('error' in response) {
    console.error('Error getting tracked windows:', response.error);
    statusDiv.textContent = 'Error: ' + response.error;
  }
}

// Handle checkbox change
trackWindowCheckbox.addEventListener('change', async () => {
  const currentWindow = await browser.windows.getCurrent();
  if (!currentWindow.id) {
    console.error('Current window has no ID');
    trackWindowCheckbox.checked = !trackWindowCheckbox.checked;
    return;
  }

  const message: Message = trackWindowCheckbox.checked
    ? { type: 'TRACK_WINDOW', windowId: currentWindow.id }
    : { type: 'UNTRACK_WINDOW', windowId: currentWindow.id };

  const response = (await browser.runtime.sendMessage(message)) as MessageResponse;

  if ('error' in response) {
    console.error('Error updating window tracking:', response.error);
    statusDiv.textContent = 'Error: ' + response.error;
    // Revert checkbox state on error
    trackWindowCheckbox.checked = !trackWindowCheckbox.checked;
  } else {
    statusDiv.textContent = trackWindowCheckbox.checked
      ? 'This window is being synced'
      : 'This window is not being synced';
  }
});

// Load configuration from storage
async function loadConfig() {
  const config = await browser.storage.local.get(['serverUrl', 'authToken']);
  serverUrlInput.value = (config.serverUrl as string) || 'http://localhost:3000';
  serverTokenInput.value = (config.authToken as string) || '';
}

// Save configuration to storage
saveConfigButton.addEventListener('click', async () => {
  const serverUrl = serverUrlInput.value.trim();
  const authToken = serverTokenInput.value.trim();

  if (!serverUrl) {
    statusDiv.innerHTML = '<p style="color: red;">Server URL is required</p>';
    return;
  }

  if (!authToken) {
    statusDiv.innerHTML = '<p style="color: red;">Auth token is required</p>';
    return;
  }

  try {
    await browser.storage.local.set({ serverUrl, authToken });
    statusDiv.innerHTML = '<p style="color: green;">Configuration saved</p>';

    // Notify background script about config change
    const message: Message = { type: 'CONFIG_UPDATED' };
    await browser.runtime.sendMessage(message);
  } catch (error) {
    console.error('Error saving configuration:', error);
    statusDiv.innerHTML = '<p style="color: red;">Failed to save configuration</p>';
  }
});

// Initialize UI
updateUI();
loadConfig();
