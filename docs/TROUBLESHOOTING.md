# Tanaka Troubleshooting Guide

**Purpose**: Solutions for common issues and debugging techniques  
**Audience**: Users and developers experiencing problems  
**Prerequisites**: Basic command line knowledge

## Navigation
- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)

---

## Quick Fixes

### Extension Not Working?

1. **Check server is running**: Look for server icon in system tray or run `ps aux | grep tanaka`
2. **Verify settings**: Click extension icon → Settings → Check server URL and token
3. **Restart Firefox**: Sometimes a fresh start helps
4. **Check logs**: Open extension console (`about:debugging` → Tanaka → Inspect)

### Sync Not Working?

1. **Both devices configured?**: Ensure same server URL and token on all devices
2. **Network connectivity?**: Can you reach the server URL in a browser?
3. **Window tracked?**: Click "Track This Window" in the extension popup
4. **Wait a moment**: Sync interval adapts from 1-10 seconds based on activity

---

## Common Issues

### Extension Not Loading

**Symptoms:**
- Extension doesn't appear in Firefox after installation
- Icon missing from toolbar
- "Corrupt add-on" error

**Solutions:**

1. **Verify Firefox version**:
   ```bash
   # Check version (needs 126+)
   firefox --version
   ```

2. **Check manifest syntax**:
   ```bash
   cd extension
   npx web-ext lint
   ```

3. **Reinstall extension**:
   - Remove from `about:addons`
   - Download fresh copy
   - Install again

4. **Check browser console**:
   - Press `Ctrl+Shift+K` (Cmd+Option+K on Mac)
   - Look for red errors during install

### Server Connection Failures

**Symptoms:**
- "Failed to connect to server" error
- Red connection indicator
- Sync not working

**Solutions:**

1. **Certificate issues (HTTPS)**:
   - Navigate to server URL in browser
   - Accept self-signed certificate
   - Try extension again

2. **Firewall blocking**:
   ```bash
   # Check if port is open
   telnet localhost 8443  # or your server port

   # Allow through firewall (Linux)
   sudo ufw allow 8443
   ```

3. **Token mismatch**:
   ```bash
   # Check server token
   grep shared_token ~/.config/tanaka/tanaka.toml

   # Update in extension settings
   ```

4. **Wrong URL format**:
   - Use full URL: `https://example.com:8443`
   - Not just: `example.com`

### Sync Not Working

**Symptoms:**
- Tabs not appearing on other devices
- Changes not propagating
- Sync indicator stuck

**Diagnostic Steps:**

1. **Check extension console**:
   - `about:debugging` → This Firefox → Tanaka → Inspect
   - Look for sync errors

2. **Verify server logs**:
   ```bash
   # Follow server logs
   tail -f ~/.local/share/tanaka/tanaka.log
   # or
   journalctl -u tanaka -f  # if using systemd
   ```

3. **Test server directly**:
   ```bash
   # Test sync endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" https://localhost:8443/sync
   ```

4. **Clear and resync**:
   - Extension settings → Advanced → Clear Local Data
   - Restart extension
   - Track windows again

### High Memory Usage

**Symptoms:**
- Firefox using excessive RAM
- Extension becomes sluggish
- "Out of memory" errors

**Solutions:**

1. **Reduce tracked windows**:
   - Only track essential windows
   - Untrack before closing Firefox

2. **Clear old data**:
   ```javascript
   // In extension console
   await browser.storage.local.clear();
   ```

3. **Limit sync history**:
   - Server retains all history by default
   - Consider periodic database cleanup

4. **Check for memory leaks**:
   - `about:memory` → Measure
   - Look for "WebExtensions" section

### Build Failures

**TypeScript Build Issues:**

```bash
# Clear everything and rebuild
cd extension
rm -rf dist node_modules pnpm-lock.yaml
pnpm install
pnpm run build:dev

# Check for type errors
pnpm run typecheck
```

**Rust Build Issues:**

```bash
# Clear and rebuild
cd server
cargo clean
cargo update
cargo build

# Verbose output for debugging
RUST_BACKTRACE=1 cargo build -vv
```

### Performance Issues

**Slow Extension Startup:**

1. **Check stored data size**:
   ```javascript
   // In extension console
   const data = await browser.storage.local.get();
   console.log('Storage size:', JSON.stringify(data).length);
   ```

2. **Disable during development**:
   - Comment out non-essential features
   - Use production build for testing

**High CPU Usage:**

1. **Check for runaway loops**:
   - Profile with Firefox Developer Tools
   - Look for hot functions

2. **Reduce sync frequency**:
   ```toml
   # In server config
   poll_secs = 30  # Increase from 5
   ```

### Web Worker Issues

**Symptoms:**
- Extension freezes during sync
- Worker initialization fails
- "Worker is not defined" errors

**Solutions:**

1. **Check worker is loaded**:
   ```javascript
   // In extension console
   const workers = await browser.runtime.getBackgroundPage();
   console.log('Worker available:', typeof Worker !== 'undefined');
   ```

2. **Verify worker file exists**:
   - Check `dist/workers/crdt-worker.js` is present
   - Rebuild if missing: `pnpm run build:dev`

3. **Debug worker errors**:
   ```javascript
   // In background script console
   // Look for worker initialization errors
   ```

4. **Disable worker (fallback)**:
   - Worker automatically falls back to main thread on failure
   - Check logs for "Worker initialization failed" messages

### Development Environment Issues

**pnpm not found:**

```bash
# Enable corepack (included with Node.js)
corepack enable
corepack prepare pnpm@latest --activate

# Or install globally
npm install -g pnpm
```

**Port already in use:**

```bash
# Find what's using the port
lsof -i :8443  # macOS/Linux
netstat -ano | findstr :8443  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Firefox won't start:**

```bash
# Use different profile
cd extension
pnpm run start -- --firefox-profile=tanaka-dev

# Or specify Firefox binary
pnpm run start -- --firefox="/Applications/Firefox.app/Contents/MacOS/firefox"
```

---

## Debugging Techniques

### Extension Debugging

1. **Enable verbose logging**:
   ```typescript
   // Add to background.ts
   const DEBUG = true;
   console.log = DEBUG ? console.log : () => {};
   ```

2. **Inspect storage**:
   ```javascript
   // View all stored data
   await browser.storage.local.get();

   // Watch for changes
   browser.storage.onChanged.addListener((changes, area) => {
     console.log('Storage changed:', changes);
   });
   ```

3. **Monitor network requests**:
   - Open DevTools Network tab
   - Filter by "sync" or your server URL
   - Check request/response details

4. **Debug message passing**:
   ```typescript
   // Log all messages
   browser.runtime.onMessage.addListener((msg, sender) => {
     console.log('Message:', msg, 'From:', sender);
     return true;
   });
   ```

### Server Debugging

1. **Enable debug logging**:
   ```bash
   RUST_LOG=debug tanaka-server
   ```

2. **Inspect database**:
   ```bash
   sqlite3 ~/.local/share/tanaka/tabs.db
   .tables
   SELECT * FROM tabs LIMIT 10;
   ```

3. **Monitor performance**:
   ```bash
   # Watch server metrics
   curl http://localhost:8443/metrics  # if enabled
   ```

### CRDT State Debugging

```typescript
// In extension console
import * as Y from 'yjs';

// Get current state
const doc = syncManager.getDocument();
console.log('Doc state:', doc.toJSON());

// Check for pending updates
const pending = Y.encodeStateAsUpdate(doc);
console.log('Pending size:', pending.byteLength);
```

---

## Security Debugging

### Certificate Problems

1. **Generate new self-signed cert**:
   ```bash
   openssl req -x509 -newkey rsa:4096 \
     -keyout key.pem -out cert.pem \
     -days 365 -nodes \
     -subj "/CN=localhost"
   ```

2. **Check certificate details**:
   ```bash
   openssl x509 -in cert.pem -text -noout
   ```

3. **Test TLS connection**:
   ```bash
   openssl s_client -connect localhost:8443
   ```

### Permission Issues

1. **Check extension permissions**:
   ```javascript
   // List current permissions
   const perms = await browser.permissions.getAll();
   console.log('Permissions:', perms);
   ```

2. **Request missing permissions**:
   ```javascript
   await browser.permissions.request({
     permissions: ['tabs']
   });
   ```

---

## Getting Help

### Before Asking for Help

1. **Check logs**: Both extension console and server logs
2. **Try quick fixes**: Restart, clear data, check settings
3. **Search issues**: [GitHub Issues](https://github.com/goodbadwolf/tanaka/issues)
4. **Minimal reproduction**: Can you reproduce with a fresh profile?

### Information to Provide

When reporting issues, include:

```markdown
**Environment:**
- OS: [e.g., macOS 13.5]
- Firefox: [e.g., 126.0]
- Tanaka Extension: [version from about:addons]
- Tanaka Server: [run `tanaka-server --version`]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [What happens vs. what you expected]

**Logs:**
[Paste relevant logs from extension console and server]
```

### Where to Get Help

1. **GitHub Issues**: [Report bugs](https://github.com/goodbadwolf/tanaka/issues)
2. **Discussions**: [Ask questions](https://github.com/goodbadwolf/tanaka/discussions)
3. **Documentation**: Check all guides in docs/

---

## Advanced Diagnostics

### Performance Profiling

```javascript
// Profile sync operation
console.time('sync');
await syncManager.sync();
console.timeEnd('sync');

// Memory profiling
if (performance.memory) {
  console.log('Memory:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
  });
}
```

### Network Diagnostics

```bash
# Test server connectivity
curl -v -H "Authorization: Bearer YOUR_TOKEN" https://localhost:8443/health

# Check DNS resolution
nslookup your-server.com

# Trace network path
traceroute your-server.com
```

### Database Diagnostics

```sql
-- Check database integrity
PRAGMA integrity_check;

-- View table structure
.schema tabs

-- Check database size
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

-- Recent activity
SELECT datetime(updated_at, 'unixepoch', 'localtime'), device_id, COUNT(*)
FROM tabs
GROUP BY device_id
ORDER BY updated_at DESC
LIMIT 10;
```

---

## Preventive Measures

### Regular Maintenance

1. **Update regularly**: Keep extension and server updated
2. **Monitor logs**: Check for warnings before they become errors
3. **Backup database**: Regular SQLite backups
4. **Clean old data**: Periodic cleanup of old tabs

### Best Practices

1. **Use stable Firefox**: Avoid beta/nightly for production
2. **Secure your server**: Use real certificates, strong tokens
3. **Monitor resources**: Set up alerts for high CPU/memory
4. **Test updates**: Try updates on one device first

---

## Related Documentation

- [Getting Started](GETTING-STARTED.md) - Initial setup
- [Development](DEVELOPMENT.md) - Building from source
- [Architecture](ARCHITECTURE.md) - Understanding internals
