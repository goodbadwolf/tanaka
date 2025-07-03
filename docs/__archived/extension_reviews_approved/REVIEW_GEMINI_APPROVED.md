# Gemini Review - Approved Implementation Guide

This document extracts the valuable standards compliance and security recommendations from the Gemini review that Tanaka should verify it implements.

## 🎯 Security & Standards Compliance

### 1. Dynamic Permission Verification (MV3)
**Why**: Users can revoke host permissions at any time in MV3
**Check**: Ensure Tanaka handles permission revocation gracefully

```typescript
// Before any cross-origin request to sync server
async function syncWithPermissionCheck(): Promise<Result<void, Error>> {
  const requiredOrigins = [`${CONFIG.serverUrl}/*`];

  const hasPermission = await browser.permissions.contains({
    origins: requiredOrigins
  });

  if (!hasPermission) {
    // Handle gracefully - don't crash
    return err(new Error('Sync permission revoked by user'));
  }

  // Proceed with sync
  return performSync();
}
```

### 2. Strict Content Security Policy
**Why**: Prevents XSS and code injection attacks
**Check**: Verify manifest.json has strict CSP

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

**Critical**: Never add `'unsafe-inline'`, `'unsafe-eval'`, or external script sources

### 3. Event Listener Registration Pattern
**Why**: Event pages require synchronous listener registration
**Check**: All listeners at script top level

```typescript
// ✅ Correct - at top level
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onUpdated.addListener(handleTabUpdate);
browser.alarms.onAlarm.addListener(handleAlarm);

// ❌ Wrong - inside async callback
async function init() {
  const settings = await loadSettings();
  browser.runtime.onMessage.addListener(...); // Won't work!
}
```

### 4. Storage API Best Practices
**Why**: Performance optimization for frequent operations
**Check**: Use appropriate storage areas

```typescript
// Use session storage for temporary data (faster, memory-based)
await browser.storage.session.set({
  pendingOperations: ops  // Cleared on browser restart
});

// Use local storage for persistent data
await browser.storage.local.set({
  userSettings: settings  // Survives restarts
});

// Batch reads for performance
const data = await browser.storage.local.get(['settings', 'syncState', 'deviceId']);
// Not three separate calls
```

### 5. Promise-Based Message Handlers
**Why**: Clean async handling, proper error propagation
**Check**: All message handlers return promises

```typescript
// Correct pattern
browser.runtime.onMessage.addListener((message, sender) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      // Return promise directly for async response
      return browser.storage.local.get('settings');

    case 'SYNC_NOW':
      // Return promise for async operation
      return performSync();

    default:
      // Explicitly handle unknown messages
      return Promise.reject(new Error(`Unknown message type: ${message.type}`));
  }
});
```

### 6. Secure DOM Manipulation (If Applicable)
**Why**: Prevent DOM-based XSS
**Check**: Never use innerHTML with external data

```typescript
// ❌ Never
element.innerHTML = externalData;

// ✅ Safe for text
element.textContent = externalData;

// ✅ Safe for structure
const link = document.createElement('a');
link.href = sanitizedUrl;
link.textContent = 'Link text';
container.appendChild(link);

// ✅ If HTML needed (rare), sanitize
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(htmlContent);
```

## 📋 Manifest V3 Migration Checklist

If not already on MV3:

```json
{
  "manifest_version": 3,  // Required

  // V2 → V3 changes
  "host_permissions": ["*://*.example.com/*"],  // Moved from permissions
  "permissions": ["storage", "alarms"],  // Only API permissions

  "action": {  // Renamed from browser_action
    "default_popup": "popup.html"
  },

  "background": {
    "scripts": ["background.js"],  // Event-driven by default
    "type": "module"  // Enable ES modules
  }
}
```

## 🚀 Performance Optimizations

### Storage Caching Pattern
**Why**: Reduce async storage calls
```typescript
class CachedSettings {
  private cache: Settings | null = null;

  async get(): Promise<Settings> {
    if (!this.cache) {
      const { settings } = await browser.storage.local.get('settings');
      this.cache = settings;
    }
    return this.cache;
  }

  async set(settings: Settings): Promise<void> {
    this.cache = settings;
    await browser.storage.local.set({ settings });
  }
}
```

### Alarm API for Persistent Timers
**Why**: setTimeout doesn't survive event page suspension
```typescript
// Replace setTimeout for long delays
browser.alarms.create('sync-alarm', {
  periodInMinutes: 5  // Survives script unload
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-alarm') {
    performSync();
  }
});
```

## ❌ Things to Avoid from Gemini Review

1. **Basic project setup advice** - Tanaka is already sophisticated
2. **Webpack migration** - Rspack is superior
3. **ESLint/Prettier setup** - Already configured
4. **var → const/let** - Using TypeScript
5. **Content script patterns** - Not applicable
6. **Basic directory structure** - Already well-organized
7. **Conventional commits** - Already using
8. **Generic ES6 patterns** - Too basic
9. **JSDoc everywhere** - TypeScript provides types
10. **DOM optimization** - Background-focused extension

## 📋 Implementation Priority

1. **Verify strict CSP in manifest** (security critical)
2. **Check permission handling** (MV3 compliance)
3. **Audit storage usage** (performance win)
4. **Verify event listener patterns** (reliability)
5. **Verify promise-based message handlers** (likely already done)

## 🎯 Success Criteria

- [ ] Extension works with host permissions revoked (graceful degradation)
- [ ] Strict CSP prevents any inline script execution
- [ ] All background listeners registered at top level
- [ ] Storage operations batched where possible
- [ ] Extension ready for AMO submission
