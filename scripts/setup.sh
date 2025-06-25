#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/../server/scripts/utils.sh"

install_rust() {
    if ! command -v cargo >/dev/null 2>&1; then
        curl https://sh.rustup.rs -sSf | sh -s -- -y
    fi
}

install_node() {
    if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
        if is_macosx && command -v brew >/dev/null 2>&1; then
            brew install node
        elif is_linux && command -v apt-get >/dev/null 2>&1; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            echo "Unsupported platform for Node installation" >&2
            exit 1
        fi
    fi
}

install_pnpm() {
    if ! command -v pnpm >/dev/null 2>&1; then
        corepack enable
        corepack prepare pnpm@latest --activate
    fi
}

install_sqlite() {
    if ! command -v sqlite3 >/dev/null 2>&1; then
        if is_macosx && command -v brew >/dev/null 2>&1; then
            brew install sqlite
        elif is_linux && command -v apt-get >/dev/null 2>&1; then
            sudo apt-get install -y sqlite3
        fi
    fi
}

install_sqlx() {
    if ! command -v sqlx >/dev/null 2>&1; then
        cargo install sqlx-cli --no-default-features --features sqlite
    fi
}

install_rust
install_node
install_pnpm
install_sqlite
install_sqlx

printf '\nAll dependencies installed.\n'
