import browser from 'webextension-polyfill';
import * as Y from 'yjs';

// Initialize Yjs document for tab state
const doc = new Y.Doc();
const _tabsMap = doc.getMap('tabs');
const _windowsMap = doc.getMap('windows');

// TODO: Use tabsMap and windowsMap for syncing state

// Track which windows are being synced
const trackedWindows = new Set<number>();

// Tab event handlers
browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.windowId && trackedWindows.has(tab.windowId)) {
    console.log('Tab created:', tab);
    // TODO: Add tab to Yjs doc and sync
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (trackedWindows.has(removeInfo.windowId)) {
    console.log('Tab removed:', tabId);
    // TODO: Remove tab from Yjs doc and sync
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.windowId && trackedWindows.has(tab.windowId) && changeInfo.url) {
    console.log('Tab updated:', tabId, changeInfo);
    // TODO: Update tab in Yjs doc and sync
  }
});

browser.tabs.onMoved.addListener(async (tabId, moveInfo) => {
  if (trackedWindows.has(moveInfo.windowId)) {
    console.log('Tab moved:', tabId, moveInfo);
    // TODO: Update tab position in Yjs doc and sync
  }
});

// Window event handlers
browser.windows.onRemoved.addListener(async (windowId) => {
  if (trackedWindows.has(windowId)) {
    trackedWindows.delete(windowId);
    console.log('Tracked window removed:', windowId);
    // TODO: Remove window from Yjs doc and sync
  }
});

// Message handler for popup
browser.runtime.onMessage.addListener(async (message: any) => {
  switch (message.type) {
    case 'TRACK_WINDOW':
      trackedWindows.add(message.windowId);
      console.log('Now tracking window:', message.windowId);
      // TODO: Add window to Yjs doc and sync
      return { success: true };

    case 'UNTRACK_WINDOW':
      trackedWindows.delete(message.windowId);
      console.log('Stopped tracking window:', message.windowId);
      // TODO: Remove window from Yjs doc and sync
      return { success: true };

    case 'GET_TRACKED_WINDOWS':
      return { windowIds: Array.from(trackedWindows) };

    default:
      return { error: 'Unknown message type' };
  }
});

console.log('Tanaka background service initialized');
