# Getting Started with Tanaka

**Purpose**: Quick installation guide for end users  
**Audience**: Users wanting to sync Firefox tabs across devices  
**Prerequisites**: Firefox 126+ and basic command line knowledge

## Navigation
- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)

---

## Quick Start (5 minutes)

> **⚠️ IMPORTANT - Phase 3 Status**: Tanaka is currently undergoing critical fixes. Multi-device synchronization is temporarily non-functional due to authentication bugs. You can still use Tanaka on a single device. See [Phase 3 Critical Fixes](ROADMAP.md#-phase-3-critical-fixes) for details.

### Step 1: Install the Extension

```bash
# Download the latest signed extension
curl -LO https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka.xpi
```

1. Open Firefox and go to `about:addons`
2. Click the gear icon ⚙ → **Install Add-on From File…**
3. Select the downloaded `tanaka.xpi`
4. Firefox will verify and install the extension

### Step 2: Install the Server

**Option A - Download Pre-built Binary (Recommended)**
```bash
# Download server for your platform
curl -LO https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka-server-$(uname -m)-$(uname -s | tr '[:upper:]' '[:lower:]')
chmod +x tanaka-server-*
sudo mv tanaka-server-* /usr/local/bin/tanaka-server
```

**Option B - Build from Source**
```bash
# Requires Rust installed (rustup.rs)
git clone https://github.com/goodbadwolf/tanaka.git
cd tanaka/server && cargo build --release
sudo cp target/release/tanaka-server /usr/local/bin/
```

### Step 3: Configure & Run

1. Create config directory:
   ```bash
   mkdir -p ~/.config/tanaka
   ```

2. Create `~/.config/tanaka/tanaka.toml`:
   ```toml
   [server]
   bind_addr = "127.0.0.1:8443"  # For local use

   [auth]
   shared_token = "your-secret-token-here"  # Change this!

   # For HTTPS (recommended)
   [tls]
   cert_path = "/path/to/cert.pem"
   key_path = "/path/to/key.pem"
   ```

3. Start the server:
   ```bash
   tanaka-server --config ~/.config/tanaka/tanaka.toml
   ```

### Step 4: Connect Extension to Server

1. Click the Tanaka extension icon in Firefox
2. Go to Settings (gear icon)
3. Enter your server URL (e.g., `https://localhost:8443`)
4. Enter your auth token (from config)
5. Click "Save"

### Step 5: Start Tracking! (Single Device Only)

- Click "Track This Window" to track tabs from any Firefox window
- Changes are saved locally and to the server
- **Note**: Multi-device sync is currently broken (see [Phase 3 fixes](ROADMAP.md#-phase-3-critical-fixes)). Once Phase 3 is complete, you'll be able to sync between devices.

---

## System Requirements

| Component | Requirement |
|-----------|-------------|
| Firefox | Version 126 or newer |
| Server OS | Linux, macOS, or Windows |
| SQLite | Version 3.40+ (usually pre-installed) |
| TLS Certificate | Self-signed or Let's Encrypt (for HTTPS) |

---

## Configuration Options

### Basic Configuration

The minimal config file needs just:

```toml
[server]
bind_addr = "127.0.0.1:8443"

[auth]
shared_token = "change-this-to-something-secure"
```

### Full Configuration Reference

```toml
[server]
bind_addr = "0.0.0.0:443"    # Listen address
poll_secs = 5                # Base sync interval (adaptive: 1-10s)
flush_secs = 5               # Database flush interval

[tls]
cert_path = "/etc/letsencrypt/live/example.com/fullchain.pem"
key_path = "/etc/letsencrypt/live/example.com/privkey.pem"

[auth]
shared_token = "your-secret-token"
```

### Running Without HTTPS (Development Only)

For local development, you can run without TLS:

```toml
[server]
bind_addr = "127.0.0.1:8000"  # HTTP port

[auth]
shared_token = "dev-token"
```

---

## Running as a Service

### Linux (systemd)

1. Create system user:
   ```bash
   sudo useradd -r -s /bin/false -d /var/lib/tanaka tanaka
   sudo mkdir -p /var/lib/tanaka
   sudo chown tanaka:tanaka /var/lib/tanaka
   ```

2. Create `/etc/systemd/system/tanaka.service`:
   ```ini
   [Unit]
   Description=Tanaka Server
   After=network.target

   [Service]
   ExecStart=/usr/local/bin/tanaka-server --config /etc/tanaka/tanaka.toml
   User=tanaka
   Group=tanaka
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now tanaka
   ```

### macOS (launchd)

Create `~/Library/LaunchAgents/com.tanaka.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tanaka.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/tanaka-server</string>
        <string>--config</string>
        <string>/Users/YOUR_USERNAME/.config/tanaka/tanaka.toml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load with: `launchctl load ~/Library/LaunchAgents/com.tanaka.server.plist`

---

## Backup & Restore

### Backup Database
```bash
# Create backup while server is running
sqlite3 /var/lib/tanaka/tabs.db ".backup '/backup/tabs-$(date +%Y%m%d).db'"
```

### Restore Database
```bash
# Stop server, replace database, restart
sudo systemctl stop tanaka
sudo cp /backup/tabs-20240315.db /var/lib/tanaka/tabs.db
sudo systemctl start tanaka
```

---

## Uninstall

### Remove Extension
1. Go to `about:addons` in Firefox
2. Find Tanaka and click Remove

### Remove Server
```bash
# Stop service
sudo systemctl disable --now tanaka  # Linux
launchctl unload ~/Library/LaunchAgents/com.tanaka.server.plist  # macOS

# Remove files
sudo rm -f /usr/local/bin/tanaka-server
rm -rf ~/.config/tanaka
sudo rm -rf /var/lib/tanaka /etc/tanaka
```

---

## Next Steps

- **Having issues?** See [Troubleshooting](TROUBLESHOOTING.md)
- **Want to contribute?** See [Development](DEVELOPMENT.md)
- **Curious about internals?** See [Architecture](ARCHITECTURE.md)

---

## Frequently Asked Questions

**Q: Can I use this with multiple Firefox profiles?**  
A: Currently limited to single-device use due to Phase 3 critical fixes. Once these are complete, each profile will be able to track different windows independently across devices.

**Q: How secure is my data?**  
A: All communication uses HTTPS with your auth token. The server stores only tab URLs and titles.

**Q: Can I sync with mobile Firefox?**  
A: Not yet - mobile Firefox doesn't support WebExtensions like desktop.

**Q: How many tabs can it handle?**  
A: Designed for 200+ tabs across all devices. Performance may vary with more.

For more questions, see [Troubleshooting](TROUBLESHOOTING.md) or [file an issue](https://github.com/goodbadwolf/tanaka/issues).
