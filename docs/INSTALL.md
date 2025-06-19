# Tanaka – Install & Run

This guide walks through a **clean install** for personal use—no build tools necessary on the target machine. You’ll download a pre-signed extension, run a single Rust binary, and you’re done.

---

## 1 Prerequisites

| Tool                             | Reason                            |
| -------------------------------- | --------------------------------- |
| **Rust** (if compiling yourself) | `rustup toolchain install stable` |
| **SQLite 3.40+**                 | Single-file durability            |
| **TLS cert**                     | Self-signed or Let’s Encrypt      |
| **Firefox** 126+                 | Supports signed unlisted add-ons  |

> **Note** – Node/pnpm are **not** required unless you plan to hack on the extension source.

---

## 2 Server – build or download

```bash
# Option A – download a release binary
curl -LO https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka-server-$(uname -m)-$(uname -s | tr '[:upper:]' '[:lower:]')
chmod +x tanaka-server-*
sudo mv tanaka-server-* /usr/local/bin/tanaka-server

# Option B – build from source
git clone https://github.com/goodbadwolf/tanaka.git
cd tanaka/server && cargo build --release
sudo cp target/release/tanaka-server /usr/local/bin/
```

Copy `config/example.toml` to `~/.config/tanaka/tanaka.toml` and edit the paths and token.

Run the server:

```bash
/usr/local/bin/tanaka-server --config ~/.config/tanaka/tanaka.toml
```

### 2.1 Systemd unit (optional)

First create a dedicated user for the service:

```bash
sudo useradd -r -s /bin/false -d /var/lib/tanaka tanaka
sudo mkdir -p /var/lib/tanaka
sudo chown tanaka:tanaka /var/lib/tanaka
```

Then create `/etc/systemd/system/tanaka.service`:

```
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

`sudo systemctl daemon-reload && sudo systemctl enable --now tanaka`

---

## 3 Extension – install signed release

```bash
# Download the latest Mozilla-signed XPI
curl -LO \
  https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka.xpi
```

1. Firefox → `about:addons` → ⚙ → **Install Add-on From File…**
2. Select `tanaka.xpi`. Firefox will confirm the signature (unlisted channel).
3. Enter your server URL + token in the extension options page.
4. **Auto-update** – When a new release appears, Firefox updates silently via the built-in `update_url`.

---

## 4 Configuration reference (`tanaka.toml`)

```toml
[server]
bind_addr   = "0.0.0.0:443"
poll_secs   = 5
flush_secs  = 5

[tls]
cert_path = "/etc/letsencrypt/live/example.com/fullchain.pem"
key_path  = "/etc/letsencrypt/live/example.com/privkey.pem"

[auth]
shared_token = "replace-me"
```

The server sets `PRAGMA journal_mode=WAL` and `busy_timeout=3000` automatically at startup.

---

## 5 Backup & restore

```bash
# SQLite live backup
sqlite3 /var/lib/tanaka/tabs.db ".backup '/backup/tabs-$(date +%s).db'"
```

Replace the file and restart the service to restore.

---

## 6 Uninstall

```bash
sudo systemctl disable --now tanaka  # if using systemd
sudo rm -f /usr/local/bin/tanaka-server
rm -rf ~/.config/tanaka /etc/tanaka
# Remove the extension via about:addons
```

Enjoy seamless tab sync across your machines!
