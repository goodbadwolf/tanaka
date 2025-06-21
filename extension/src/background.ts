import browser from 'webextension-polyfill';
import { asMessage, type MessageResponse } from './core.js';
import { TanakaAPI, browserTabToSyncTab, type Tab } from './api.js';

// Initialize API client
const api = new TanakaAPI();

// Load config on startup
async function loadConfig() {
  const config = await browser.storage.local.get(['serverUrl', 'authToken']);
  const serverUrl = (config.serverUrl as string) || 'http://localhost:3000';
  const authToken = (config.authToken as string) || 'tanaka-secret-token';
  api.updateConfig(serverUrl, authToken);
}

// Load initial config
loadConfig();

// Track which windows are being synced
const trackedWindows = new Set<number>();

// Sync state
let syncInterval: number | null = null;

// Collect all tabs from tracked windows
async function collectTrackedTabs() {
  const tabs: Parameters<typeof browserTabToSyncTab>[0][] = [];

  for (const windowId of trackedWindows) {
    try {
      const windowTabs = await browser.tabs.query({ windowId });
      tabs.push(...windowTabs);
    } catch (error) {
      console.error(`Failed to get tabs for window ${windowId}:`, error);
    }
  }

  return tabs
    .map((tab) => (tab.windowId ? browserTabToSyncTab(tab, tab.windowId) : null))
    .filter((tab): tab is Tab => tab !== null);
}

// Sync tabs with server
async function syncWithServer() {
  if (trackedWindows.size === 0) return;

  try {
    const localTabs = await collectTrackedTabs();
    const allTabs = await api.syncTabs(localTabs);
    console.log(`Synced ${localTabs.length} local tabs, received ${allTabs.length} total tabs`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Start periodic sync
function startSync() {
  if (syncInterval) return;

  // Initial sync
  syncWithServer();

  // Sync every 5 seconds
  syncInterval = window.setInterval(() => {
    syncWithServer();
  }, 5000);
}

// Stop periodic sync
function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// Tab event handlers
browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.windowId && trackedWindows.has(tab.windowId)) {
    console.log('Tab created:', tab);
    syncWithServer();
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (trackedWindows.has(removeInfo.windowId)) {
    console.log('Tab removed:', tabId);
    syncWithServer();
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.windowId && trackedWindows.has(tab.windowId) && changeInfo.url) {
    console.log('Tab updated:', tabId, changeInfo);
    syncWithServer();
  }
});

browser.tabs.onMoved.addListener(async (tabId, moveInfo) => {
  if (trackedWindows.has(moveInfo.windowId)) {
    console.log('Tab moved:', tabId, moveInfo);
    syncWithServer();
  }
});

// Window event handlers
browser.windows.onRemoved.addListener(async (windowId) => {
  if (trackedWindows.has(windowId)) {
    trackedWindows.delete(windowId);
    console.log('Tracked window removed:', windowId);

    if (trackedWindows.size === 0) {
      stopSync();
    } else {
      syncWithServer();
    }
  }
});

// Message handler for popup
browser.runtime.onMessage.addListener(async (message: unknown): Promise<MessageResponse> => {
  const msg = asMessage(message);
  if (!msg) {
    return { error: 'Invalid message format' };
  }

  switch (msg.type) {
    case 'TRACK_WINDOW':
      trackedWindows.add(msg.windowId);
      console.log('Now tracking window:', msg.windowId);
      startSync();
      return { success: true };

    case 'UNTRACK_WINDOW':
      trackedWindows.delete(msg.windowId);
      console.log('Stopped tracking window:', msg.windowId);

      if (trackedWindows.size === 0) {
        stopSync();
      } else {
        syncWithServer();
      }
      return { success: true };

    case 'GET_TRACKED_WINDOWS':
      return { windowIds: Array.from(trackedWindows) };

    case 'CONFIG_UPDATED':
      await loadConfig();
      console.log('Configuration updated');
      return { success: true };

    default:
      return { error: 'Unknown message type' };
  }
});

console.log('Tanaka background service initialized');
