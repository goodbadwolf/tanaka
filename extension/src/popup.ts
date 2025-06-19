import browser from 'webextension-polyfill';

const trackWindowCheckbox = document.getElementById('track-window') as HTMLInputElement;
const _statusDiv = document.getElementById('status') as HTMLDivElement;

// Get current window tracking status
async function updateUI() {
  const currentWindow = await browser.windows.getCurrent();
  const response = await browser.runtime.sendMessage({
    type: 'GET_TRACKED_WINDOWS',
  });

  const trackedWindows = response.windowIds || [];
  trackWindowCheckbox.checked = trackedWindows.includes(currentWindow.id);
}

// Handle checkbox change
trackWindowCheckbox.addEventListener('change', async () => {
  const currentWindow = await browser.windows.getCurrent();

  if (trackWindowCheckbox.checked) {
    await browser.runtime.sendMessage({
      type: 'TRACK_WINDOW',
      windowId: currentWindow.id,
    });
  } else {
    await browser.runtime.sendMessage({
      type: 'UNTRACK_WINDOW',
      windowId: currentWindow.id,
    });
  }
});

// Initialize UI
updateUI();
