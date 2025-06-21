import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from '../core.js';

const trackWindowCheckbox = document.getElementById('track-window') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const openSettingsLink = document.getElementById('open-settings') as HTMLAnchorElement;

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
    updateStatus(trackWindowCheckbox.checked);
  } else if ('error' in response) {
    console.error('Error getting tracked windows:', response.error);
    statusDiv.innerHTML = `<p style="color: red;">Error: ${response.error}</p>`;
  }
}

function updateStatus(isTracked: boolean) {
  statusDiv.innerHTML = isTracked
    ? '<p style="color: green;">✓ This window is being synced</p>'
    : '<p>This window is not being synced</p>';
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
    statusDiv.innerHTML = `<p style="color: red;">Error: ${response.error}</p>`;
    // Revert checkbox state on error
    trackWindowCheckbox.checked = !trackWindowCheckbox.checked;
  } else {
    updateStatus(trackWindowCheckbox.checked);
  }
});

// Open settings
openSettingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

// Initialize UI
updateUI();
