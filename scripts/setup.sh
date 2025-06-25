#!/usr/bin/env bash

# Tanaka Prerequisites Setup Script
# This script installs all required tools for developing Tanaka

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# OS Detection
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE="Linux";;
    Darwin*)    OS_TYPE="macOS";;
    *)          error "Unsupported OS: ${OS}"; exit 1;;
esac

info "Detected OS: ${OS_TYPE}"

# Check and install Rust
info "Checking Rust installation..."
if check_command rustc; then
    RUST_VERSION=$(rustc --version | cut -d' ' -f2)
    info "Rust ${RUST_VERSION} is already installed"
else
    info "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Check and install nvm and Node.js
info "Checking Node.js installation..."
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    info "nvm is already installed"
    source "$HOME/.nvm/nvm.sh"
else
    info "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install Node.js 24
info "Installing Node.js 24..."
nvm install 24
nvm alias default 24
nvm use 24

NODE_VERSION=$(node --version)
info "Node.js ${NODE_VERSION} installed"

# Install pnpm
info "Installing pnpm globally..."
npm install -g pnpm
PNPM_VERSION=$(pnpm --version)
info "pnpm ${PNPM_VERSION} installed"

# Check SQLite
info "Checking SQLite installation..."
if check_command sqlite3; then
    SQLITE_VERSION=$(sqlite3 --version | cut -d' ' -f1)
    info "SQLite ${SQLITE_VERSION} is installed"
else
    warn "SQLite not found. Please install SQLite 3.40+ using your system package manager:"
    case "${OS_TYPE}" in
        Linux)
            warn "  Ubuntu/Debian: sudo apt-get install sqlite3"
            warn "  Fedora/RHEL: sudo dnf install sqlite"
            warn "  Arch: sudo pacman -S sqlite"
            ;;
        macOS)
            warn "  macOS: brew install sqlite"
            ;;
    esac
fi

# Check Firefox
info "Checking Firefox installation..."
if check_command firefox || [ -d "/Applications/Firefox.app" ]; then
    info "Firefox is installed"
else
    warn "Firefox not found. Please install Firefox 126+ from https://www.mozilla.org/firefox/"
fi

# Install SQLx CLI (optional)
read -p "Install SQLx CLI for database migrations? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "Installing SQLx CLI..."
    cargo install sqlx-cli --no-default-features --features sqlite
fi

# Summary
echo
info "Setup complete! Prerequisites installed:"
echo "  ✓ Rust $(rustc --version | cut -d' ' -f2)"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ pnpm $(pnpm --version)"

if check_command sqlite3; then
    echo "  ✓ SQLite $(sqlite3 --version | cut -d' ' -f1)"
else
    echo "  ✗ SQLite (manual installation required)"
fi

if check_command firefox || [ -d "/Applications/Firefox.app" ]; then
    echo "  ✓ Firefox"
else
    echo "  ✗ Firefox (manual installation required)"
fi

echo
info "Next steps:"
echo "  1. cd tanaka/server && cargo build"
echo "  2. cd tanaka/extension && pnpm install && pnpm run build"
echo "  3. See docs/DEV.md for development instructions"