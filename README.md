# Tanaka

<!-- [![CI](https://github.com/goodbadwolf/tanaka/actions/workflows/ci.yml/badge.svg)](https://github.com/goodbadwolf/tanaka/actions/workflows/ci.yml) -->

<!-- [![Release](https://img.shields.io/github/v/release/goodbadwolf/tanaka?include_prereleases)](https://github.com/goodbadwolf/tanaka/releases) -->

Tanaka keeps your Firefox browsing **entangled** across every computer you use. Open a tab at work and it’s already there when you get home; close a noisy article on your laptop and it vanishes from your desktop too. Tanaka selectively mirrors _tracked_ windows so your workspace feels like a single, coherent browser—no matter how many machines you run.

> **Why “Tanaka”?**  
> **田中** means “among the fields.” Tanaka lives _between_ your devices, weaving isolated browsers into one continuous field of tabs.

---

## ✨ Features

| Capability                  | Notes                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Live mirroring**          | Tab create / move / close events propagate across devices in ~1 s (baseline poll 5 s, adaptive downwards on activity). |
| **Selective tracking**      | Opt-in per window; leave private or throw-away windows unsynced.                                                        |
| **Session resurrection**    | Browser crashed? Tanaka restores the last good state from another device.                                               |
| **Conflict-free merges**    | Uses Yjs/yrs CRDTs—order-independent, race-free.                                                                        |
| **End-to-end encryption**   | TLS + shared token; data never travels plaintext.                                                                       |
| _(Planned)_ **Scroll sync** | Resume reading at exactly the same pixel offset.                                                                        |

---

## 🛠️ Tech Stack (Personal-Scale)

| Tier            | Technology                                          | Rationale                                            |
| --------------- | --------------------------------------------------- | ---------------------------------------------------- |
| **Extension**   | TypeScript + WebExtension API + Yjs                 | Native API support & fast dev loop.                  |
| **Tanaka server** | Rust (**axum** + tokio + yrs)                       | Async, small single binary, excellent performance.   |
| **Persistence** | **SQLite 3 (WAL)** + in-memory read cache (DashMap) | Crash-safe, zero-config file DB, ultra-fast lookups. |
| **OpenAPI UI**  | **utoipa-swagger-ui** (enabled at `/swagger/`)      | FastAPI-style swagger docs out-of-the-box.           |

---

## 🚀 Quick Start

1. **Install the extension**: Download the latest `tanaka.xpi` from [releases](https://github.com/goodbadwolf/tanaka/releases)
2. **Run the server**: Clone the repo and follow the setup in [docs/INSTALL.md](@docs/INSTALL.md)

For detailed installation instructions, see [docs/INSTALL.md](@docs/INSTALL.md).

---

## 🏗️ Architecture Overview

Tanaka uses a client-server architecture with CRDT-based synchronization. For detailed architecture information, see [docs/DEV.md](@docs/DEV.md#1-architecture).

---

## 🗺️ Roadmap

- **v0.1**  MVP – live tab mirroring via polling (SQLite, Swagger, CRDTs).
- **v0.2**  Scroll-position sync & persistent extension signing.
- **v0.3**  Additional optimizations for sub-second latency.
- **v1.0**  Android support, pre-built binaries for arm64, auto-update channel.

---

## 🤝 Contributing

This is a personal project and not currently accepting contributions. Feel free to fork for your own use.

---

## 📄 License

Tanaka is released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- Inspired by Firefox Sync and academic work on **CRDTs**.
- Uses open-source powerhouses: axum, tokio, Yjs/yrs, SQLite, utoipa.
