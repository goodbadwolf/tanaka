import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from '../core.js';
import { getConfig } from '../config/index.js';

const trackWindowCheckbox = document.getElementById('track-window') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const authTokenInput = document.getElementById('auth-token') as HTMLInputElement;
const saveAuthButton = document.getElementById('save-auth') as HTMLButtonElement;

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

// Load authentication settings
async function loadAuth() {
  const settings = await browser.storage.local.get(['authToken']);
  authTokenInput.value = (settings.authToken as string) || '';

  // Show server URL for information
  const serverInfo = document.createElement('p');
  serverInfo.className = 'server-info';
  serverInfo.textContent = `Server: ${getConfig().serverUrl}`;
  const configDiv = document.querySelector('.config');
  configDiv?.insertBefore(serverInfo, authTokenInput.parentElement);
}

// Save authentication
saveAuthButton.addEventListener('click', async () => {
  const authToken = authTokenInput.value.trim();

  if (!authToken) {
    statusDiv.innerHTML = '<p style="color: red;">Auth token is required</p>';
    return;
  }

  try {
    await browser.storage.local.set({ authToken });
    statusDiv.innerHTML = '<p style="color: green;">Authentication saved</p>';

    // Notify background script about config change
    const message: Message = { type: 'CONFIG_UPDATED' };
    await browser.runtime.sendMessage(message);
  } catch (error) {
    console.error('Error saving authentication:', error);
    statusDiv.innerHTML = '<p style="color: red;">Failed to save authentication</p>';
  }
});

// Initialize UI
updateUI();
loadAuth();
