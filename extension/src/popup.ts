import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from './types.js';

const trackWindowCheckbox = document.getElementById('track-window') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

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

// Initialize UI
updateUI();
