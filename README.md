# Tanaka

[![CI](https://github.com/goodbadwolf/tanaka/actions/workflows/ci.yml/badge.svg)](https://github.com/goodbadwolf/tanaka/actions/workflows/ci.yml) [![Coverage](https://codecov.io/gh/goodbadwolf/tanaka/branch/main/graph/badge.svg)](https://codecov.io/gh/goodbadwolf/tanaka) [![Release](https://img.shields.io/github/v/release/goodbadwolf/tanaka?include_prereleases)](https://github.com/goodbadwolf/tanaka/releases)

Tanaka keeps your Firefox browsing **entangled** across every computer you use. Open a tab at work and it's already there when you get home; close a noisy article on your laptop and it vanishes from your desktop too. Tanaka selectively mirrors _tracked_ windows so your workspace feels like a single, coherent browser—no matter how many machines you run.

> **🎉 MILESTONE**: All critical bugs fixed! Multi-device synchronization is fully functional.

> **Why "Tanaka"?**  
> **田中** means "among the fields." Tanaka lives _between_ your devices, weaving isolated browsers into one continuous field of tabs.

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| **[🚀 Getting Started](docs/GETTING-STARTED.md)** | Install and run Tanaka |
| **[💻 Development](docs/DEVELOPMENT.md)** | Set up development environment |
| **[🏗️ Architecture](docs/ARCHITECTURE.md)** | Understand how Tanaka works |
| **[🔧 Troubleshooting](docs/TROUBLESHOOTING.md)** | Fix common issues |
| **[📝 Git Guidelines](docs/GIT.md)** | Contribution workflow |

## ✨ Key Features

- **Live mirroring** - Changes sync across devices in real-time (adaptive 1-10s intervals)
- **Selective tracking** - Choose which windows to sync
- **Conflict-free** - CRDT technology ensures consistent state
- **Privacy-focused** - Self-hosted, your data stays yours
- **Non-blocking sync** - Web Worker offloads heavy operations for smooth UI

## 🛠️ Built With

- **Extension**: TypeScript, WebExtension API, Yjs CRDT
- **Server**: Rust, axum, tokio, yrs CRDT, SQLite
- **Architecture**: Client-server with eventual consistency
- **Testing**: cargo-nextest (2-3× faster), cargo-llvm-cov, pretty_assertions, rstest

## 🚀 Quick Start

```bash
# Download and install the extension
curl -LO https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka.xpi
# Open in Firefox to install

# Download and run the server  
curl -LO https://github.com/goodbadwolf/tanaka/releases/latest/download/tanaka-server-$(uname -m)-$(uname -s | tr '[:upper:]' '[:lower:]')
chmod +x tanaka-server-*
./tanaka-server --config ~/.config/tanaka/tanaka.toml
```

See [Getting Started](docs/GETTING-STARTED.md) for detailed instructions.


## 📄 License

Tanaka is released under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- Inspired by Firefox Sync and academic work on CRDTs
- Built with axum, tokio, Yjs/yrs, SQLite, and more amazing open source projects
