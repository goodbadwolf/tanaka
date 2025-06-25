#!/usr/bin/env python3
"""
Tanaka Setup Script
This script:
- installs all required dependencies for developing Tanaka
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum


class Color(Enum):
    """Terminal color codes"""

    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    GRAY = "\033[0;90m"
    RESET = "\033[0m"


class Logger:
    """Logger with colored output"""

    def __init__(self, enable_debug_logging: bool = False):
        self.enable_debug_logging = enable_debug_logging

    def info(self, msg: str) -> None:
        print(f"{Color.GREEN.value}[INFO]{Color.RESET.value} {msg}")

    def warn(self, msg: str) -> None:
        print(f"{Color.YELLOW.value}[WARN]{Color.RESET.value} {msg}")

    def error(self, msg: str) -> None:
        print(f"{Color.RED.value}[ERROR]{Color.RESET.value} {msg}")

    def debug(self, msg: str) -> None:
        if self.enable_debug_logging:
            print(f"{Color.GRAY.value}[DEBUG]{Color.RESET.value} {msg}")


@dataclass
class Dependency:
    """Represents a dependency with its installation info"""

    name: str
    depends_on: list[str] = field(default_factory=list)
    installer: Callable | None = None
    check_cmd: str | None = None
    version_flag: str = "--version"


class OSType(Enum):
    """Supported operating systems"""

    LINUX = "Linux"
    MACOS = "macOS"


class DependencyInstaller:
    """Base class for dependency installers"""

    def __init__(self, logger: Logger, os_type: OSType, dry_run: bool = False):
        self.logger = logger
        self.os_type = os_type
        self.dry_run = dry_run

    def check_command(self, cmd: str) -> bool:
        """Check if a command exists"""
        return shutil.which(cmd) is not None

    def run_command(
        self,
        cmd: list[str] | str,
        shell: bool = False,
        check: bool = True,
        capture: bool = True,
    ) -> subprocess.CompletedProcess:
        """Run a shell command"""
        if isinstance(cmd, list):
            self.logger.debug(f"Running: {' '.join(cmd)}")
        else:
            self.logger.debug(f"Running: {cmd}")

        if self.dry_run:
            cmd_str = cmd if isinstance(cmd, str) else ' '.join(cmd)
            self.logger.info(f"[DRY RUN] Would execute: {cmd_str}")
            # Return a fake successful result for dry run
            return subprocess.CompletedProcess(
                args=cmd, returncode=0, stdout="", stderr=""
            )

        try:
            return subprocess.run(
                cmd,
                shell=shell,
                capture_output=capture,
                text=True,
                check=check,
            )
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Command failed: {e}")
            if e.stdout:
                self.logger.debug(f"stdout: {e.stdout}")
            if e.stderr:
                self.logger.debug(f"stderr: {e.stderr}")
            raise

    def get_version(self, cmd: str, version_flag: str = "--version") -> str:
        """Get version of installed dependency"""
        try:
            result = self.run_command([cmd, version_flag])
            return result.stdout.strip().split("\n")[0]
        except Exception:
            return "unknown"


class RustInstaller(DependencyInstaller):
    """Handles Rust installation"""

    def install(self) -> bool:
        if self.check_command("rustc"):
            version = self.get_version("rustc")
            self.logger.info(f"Rust already installed: {version}")
            return True

        self.logger.info("Installing Rust...")
        try:
            rustup_url = "https://sh.rustup.rs"
            install_cmd = (
                f'curl --proto "=https" --tlsv1.2 -sSf {rustup_url} | sh -s -- -y'
            )
            self.run_command(install_cmd, shell=True)

            # Add cargo to PATH for current session
            cargo_env = os.path.expanduser("~/.cargo/env")
            if os.path.exists(cargo_env):
                self.run_command(f". {cargo_env}", shell=True)

            return True
        except Exception as e:
            self.logger.error(f"Failed to install Rust: {e}")
            return False


class NodeInstaller(DependencyInstaller):
    """Handles Node.js installation via nvm"""

    NVM_VERSION = "v0.40.3"

    def install(self) -> bool:
        nvm_dir = os.path.expanduser("~/.nvm")
        nvm_sh = os.path.join(nvm_dir, "nvm.sh")

        # Install nvm if needed
        if not os.path.exists(nvm_sh):
            if not self._install_nvm():
                return False

        # Install Node.js
        return self._install_node()

    def _install_nvm(self) -> bool:
        """Install nvm"""
        self.logger.info("Installing nvm...")
        try:
            nvm_url = (
                f"https://raw.githubusercontent.com/nvm-sh/nvm/{self.NVM_VERSION}"
                f"/install.sh"
            )
            install_cmd = f"curl -o- {nvm_url} | bash"
            self.run_command(install_cmd, shell=True)
            return True
        except Exception as e:
            self.logger.error(f"Failed to install nvm: {e}")
            return False

    def _install_node(self) -> bool:
        """Install Node.js using nvm"""
        self.logger.info("Installing Node.js 24...")
        try:
            nvm_init = 'export NVM_DIR="$HOME/.nvm"'
            nvm_source = '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'
            install_cmd = f"{nvm_init} && {nvm_source} && nvm install 24"
            self.run_command(install_cmd, shell=True)
            return True
        except Exception as e:
            self.logger.error(f"Failed to install Node.js: {e}")
            return False


class PnpmInstaller(DependencyInstaller):
    """Handles pnpm installation"""

    def install(self) -> bool:
        # Ensure npm is available
        if not self.check_command("npm"):
            # Try to source nvm
            nvm_cmd = (
                'export NVM_DIR="$HOME/.nvm" && '
                '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && '
                "nvm use default"
            )
            self.run_command(nvm_cmd, shell=True, check=False)

            if not self.check_command("npm"):
                self.logger.error("Node.js/npm is required to install pnpm")
                return False

        self.logger.info("Installing pnpm globally...")
        try:
            self.run_command(["npm", "install", "-g", "pnpm"])
            return True
        except Exception as e:
            self.logger.error(f"Failed to install pnpm: {e}")
            return False


class UvInstaller(DependencyInstaller):
    """Handles uv installation"""

    def install(self) -> bool:
        if self.check_command("uv"):
            version = self.get_version("uv")
            self.logger.info(f"uv already installed: {version}")
            return True

        self.logger.info("Installing uv...")
        try:
            install_cmd = "curl -LsSf https://astral.sh/uv/install.sh | sh"
            self.run_command(install_cmd, shell=True)

            # Add to PATH for current session
            uv_bin = os.path.expanduser("~/.cargo/bin")
            if uv_bin not in os.environ.get("PATH", ""):
                os.environ["PATH"] = f"{uv_bin}:{os.environ.get('PATH', '')}"

            return True
        except Exception as e:
            self.logger.error(f"Failed to install uv: {e}")
            return False


class VenvInstaller(DependencyInstaller):
    """Handles virtual environment setup"""

    def install(self) -> bool:
        venv_path = os.path.join(os.getcwd(), ".venv")

        if os.path.exists(venv_path):
            self.logger.info("Virtual environment already exists at .venv")
            return True

        if not self.check_command("uv"):
            self.logger.error("uv is required to create virtual environment")
            return False

        self.logger.info("Creating virtual environment with uv...")
        try:
            self.run_command(["uv", "venv", ".venv"])

            # Install dev dependencies
            self.logger.info("Installing development dependencies...")
            self.run_command(["uv", "sync", "--dev"])

            self.logger.info("Virtual environment created at .venv")
            self.logger.info("Activate with: source .venv/bin/activate")
            return True
        except Exception as e:
            self.logger.error(f"Failed to setup virtual environment: {e}")
            return False


class SqlxInstaller(DependencyInstaller):
    """Handles SQLx CLI installation"""

    def install(self) -> bool:
        if not self.check_command("cargo"):
            self.logger.error("Rust/Cargo is required to install SQLx CLI")
            return False

        self.logger.info("Installing SQLx CLI...")
        try:
            self.run_command(
                [
                    "cargo",
                    "install",
                    "sqlx-cli",
                    "--no-default-features",
                    "--features",
                    "sqlite",
                ]
            )
            return True
        except Exception as e:
            self.logger.error(f"Failed to install SQLx CLI: {e}")
            return False


class FirefoxInstaller(DependencyInstaller):
    """Handles Firefox installation check"""

    def install(self) -> bool:
        # Check if already installed
        if self.check_command("firefox") or os.path.exists("/Applications/Firefox.app"):
            self.logger.info("Firefox is already installed")
            return True

        self.logger.warn("Firefox not found")

        # On macOS, offer to install via Homebrew
        if self.os_type == OSType.MACOS and self.check_command("brew"):
            if self.dry_run:
                self.logger.info("[DRY RUN] Would prompt to install Firefox via Homebrew")
                return True
            response = input("Would you like to install Firefox via Homebrew? (y/N) ")
            if response.lower() == "y":
                self.logger.info("Installing Firefox...")
                try:
                    self.run_command(["brew", "install", "--cask", "firefox"])
                    return True
                except Exception as e:
                    self.logger.error(f"Failed to install Firefox: {e}")
                    return False

        self.logger.warn(
            "Please install Firefox 126+ from https://www.mozilla.org/firefox/"
        )
        return False


class SqliteChecker(DependencyInstaller):
    """Checks SQLite installation"""

    def install(self) -> bool:
        if self.check_command("sqlite3"):
            version = self.get_version("sqlite3")
            self.logger.info(f"SQLite is installed: {version}")
            return True

        self.logger.warn(
            "SQLite not found. Please install SQLite 3.40+ "
            "using your system package manager:"
        )
        if self.os_type == OSType.LINUX:
            self.logger.warn("  Ubuntu/Debian: sudo apt-get install sqlite3")
            self.logger.warn("  Fedora/RHEL: sudo dnf install sqlite")
            self.logger.warn("  Arch: sudo pacman -S sqlite")
        elif self.os_type == OSType.MACOS:
            self.logger.warn("  macOS: brew install sqlite")
        return False


class SetupManager:
    """Manages dependency installation"""

    def __init__(self, logger: Logger, dry_run: bool = False):
        self.logger = logger
        self.dry_run = dry_run
        self.os_type = self._detect_os()
        self.installers = self._create_installers()
        self.dependencies = self._create_dependencies()
        self.installed: dict[str, str] = {}
        self.failed: set[str] = set()

    def _detect_os(self) -> OSType:
        """Detect operating system"""
        system = platform.system()
        if system == "Linux":
            return OSType.LINUX
        elif system == "Darwin":
            return OSType.MACOS
        else:
            self.logger.error(f"Unsupported OS: {system}")
            sys.exit(1)

    def _create_installers(self) -> dict[str, DependencyInstaller]:
        """Create installer instances"""
        return {
            "rust": RustInstaller(self.logger, self.os_type, self.dry_run),
            "node": NodeInstaller(self.logger, self.os_type, self.dry_run),
            "pnpm": PnpmInstaller(self.logger, self.os_type, self.dry_run),
            "sqlx": SqlxInstaller(self.logger, self.os_type, self.dry_run),
            "sqlite": SqliteChecker(self.logger, self.os_type, self.dry_run),
            "firefox": FirefoxInstaller(self.logger, self.os_type, self.dry_run),
            "uv": UvInstaller(self.logger, self.os_type, self.dry_run),
            "venv": VenvInstaller(self.logger, self.os_type, self.dry_run),
        }

    def _create_dependencies(self) -> dict[str, Dependency]:
        """Create dependency definitions"""
        return {
            "rust": Dependency(name="rust", check_cmd="rustc"),
            "node": Dependency(name="node", depends_on=[], check_cmd="node"),
            "pnpm": Dependency(name="pnpm", depends_on=["node"], check_cmd="pnpm"),
            "sqlx": Dependency(name="sqlx", depends_on=["rust"], check_cmd="sqlx"),
            "firefox": Dependency(name="firefox", check_cmd="firefox"),
            "sqlite": Dependency(name="sqlite", check_cmd="sqlite3"),
            "uv": Dependency(name="uv", check_cmd="uv"),
            "venv": Dependency(name="venv", depends_on=["uv"]),
        }

    def resolve_dependencies(self, requested: set[str]) -> list[str]:
        """Resolve dependencies in correct order"""
        resolved = []
        visited = set()

        def visit(name: str):
            if name in visited:
                return
            visited.add(name)

            dep = self.dependencies.get(name)
            if dep:
                for subdep in dep.depends_on:
                    visit(subdep)
                resolved.append(name)

        for dep in requested:
            visit(dep)

        return resolved

    def install_dependency(self, name: str) -> bool:
        """Install a single dependency"""
        installer = self.installers.get(name)
        if not installer:
            self.logger.error(f"No installer for {name}")
            return False

        # Check if already installed
        dep = self.dependencies.get(name)
        if dep and dep.check_cmd and installer.check_command(dep.check_cmd):
            version = installer.get_version(dep.check_cmd, dep.version_flag)
            self.installed[name] = version
            return True

        # Install
        if installer.install():
            self.installed[name] = "installed"
            return True
        else:
            self.failed.add(name)
            return False

    def setup(self, requested: set[str]) -> None:
        """Run the setup process"""
        self.logger.info(f"Detected OS: {self.os_type.value}")
        if self.dry_run:
            self.logger.info("Running in DRY RUN mode - no changes will be made")

        # Resolve dependencies
        to_install = self.resolve_dependencies(requested)
        self.logger.debug(f"Dependencies to install: {to_install}")

        # Install each dependency
        for dep in to_install:
            self.install_dependency(dep)

        # Print summary
        self.print_summary(requested)

    def print_summary(self, requested: set[str]) -> None:
        """Print installation summary"""
        print()
        if self.dry_run:
            self.logger.info("Dry run complete! (no changes were made)")
        else:
            self.logger.info("Setup complete!")
        print()

        # Group dependencies by category
        dev_deps = ["rust", "node", "pnpm", "sqlx", "uv"]
        env_deps = ["venv"]
        sys_deps = ["sqlite", "firefox"]

        self._print_group("Development dependencies:", dev_deps, requested)
        self._print_group("Python environment:", env_deps, requested)
        self._print_group("System dependencies:", sys_deps, requested)

        print()
        self.logger.info("Next steps:")
        print("  1. cd tanaka/server && cargo build")
        print("  2. cd tanaka/extension && pnpm install && pnpm run build")
        print("  3. See docs/DEV.md for development instructions")

    def _print_group(self, title: str, deps: list[str], requested: set[str]) -> None:
        """Print a group of dependencies"""
        print(f"\n{title}")
        for dep in deps:
            if dep in self.installed:
                print(f"  ✓ {dep.capitalize()}: {self.installed[dep]}")
            elif dep in self.failed:
                print(f"  ✗ {dep.capitalize()}: installation failed")
            elif dep in requested:
                print(f"  ✗ {dep.capitalize()}: not installed")
            else:
                print(f"  - {dep.capitalize()}: skipped")


def parse_dependencies(args) -> set[str]:
    """Parse command line arguments to determine dependencies"""
    all_deps = {"rust", "node", "pnpm", "sqlx", "sqlite", "firefox", "uv", "venv"}

    if args.include:
        # Flatten the list if needed
        includes = []
        for item in args.include:
            includes.extend(item.split(","))
        return set(includes)

    deps = all_deps.copy()
    if args.exclude:
        # Flatten the list if needed
        excludes = []
        for item in args.exclude:
            excludes.extend(item.split(","))
        deps -= set(excludes)

    return deps


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Tanaka Dependencies Setup Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                      # Install all prerequisites
  %(prog)s --include rust node  # Install only Rust and Node.js
  %(prog)s --exclude pnpm       # Install everything except pnpm
  %(prog)s --debug              # Run with debug output
  %(prog)s --dry-run            # Show what would be done without making changes

Available dependencies: rust, node, pnpm, sqlx, sqlite, firefox, uv, venv
        """,
    )

    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument(
        "--include",
        nargs="+",
        help="Dependencies to install (space or comma separated)",
    )
    parser.add_argument(
        "--exclude",
        nargs="+",
        help="Dependencies to skip (space or comma separated)",
    )

    args = parser.parse_args()
    logger = Logger(enable_debug_logging=args.debug)

    try:
        deps = parse_dependencies(args)
        manager = SetupManager(logger, dry_run=args.dry_run)
        manager.setup(deps)

    except ValueError as e:
        logger.error(str(e))
        sys.exit(1)
    except KeyboardInterrupt:
        logger.warn("Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        if args.debug:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
