"""Setup development environment task"""

import argparse
import os
import platform
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SIGINT, EXIT_SUCCESS
from logger import logger
from utils import check_command
from utils import run_command as run_cmd

from .core import TaskResult


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

    def __init__(self, os_type: OSType, dry_run: bool = False):
        self.os_type = os_type
        self.dry_run = dry_run

    def check_command(self, cmd: str) -> bool:
        """Check if a command exists"""
        return check_command(cmd)

    def run_command(
        self,
        cmd: list[str] | str,
        shell: bool = False,
        check: bool = True,
        capture: bool = True,
    ) -> subprocess.CompletedProcess:
        """Run a shell command"""
        if isinstance(cmd, list):
            logger.debug(f"Running: {' '.join(cmd)}")
        else:
            logger.debug(f"Running: {cmd}")

        if self.dry_run:
            cmd_str = cmd if isinstance(cmd, str) else " ".join(cmd)
            logger.info(f"[DRY RUN] Would execute: {cmd_str}")
            return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

        # Special handling for shell commands
        if shell and isinstance(cmd, str):
            # Shell commands need to be run with subprocess directly
            try:
                return subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=capture,
                    text=True,
                    check=check,
                )
            except subprocess.CalledProcessError as e:
                logger.error(f"Command failed: {e}")
                if e.stdout:
                    logger.debug(f"stdout: {e.stdout}")
                if e.stderr:
                    logger.debug(f"stderr: {e.stderr}")
                raise
        else:
            # Use shared utility for non-shell commands
            return run_cmd(cmd, check=check)

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
            logger.success(f"Rust already installed: {version}")
            return True

        logger.info("Installing Rust...")
        try:
            rustup_url = "https://sh.rustup.rs"
            install_cmd = f'curl --proto "=https" --tlsv1.2 -sSf {rustup_url} | sh -s -- -y'
            self.run_command(install_cmd, shell=True)

            cargo_env = os.path.expanduser("~/.cargo/env")
            if os.path.exists(cargo_env):
                self.run_command(f". {cargo_env}", shell=True)

            return True
        except Exception as e:
            logger.error(f"Failed to install Rust: {e}")
            return False


class NodeInstaller(DependencyInstaller):
    """Handles Node.js installation via nvm"""

    NVM_VERSION = "v0.40.3"

    def install(self) -> bool:
        nvm_dir = os.path.expanduser("~/.nvm")
        nvm_sh = os.path.join(nvm_dir, "nvm.sh")

        if not os.path.exists(nvm_sh):
            if not self._install_nvm():
                return False

        return self._install_node()

    def _install_nvm(self) -> bool:
        """Install nvm"""
        logger.info("Installing nvm...")
        try:
            nvm_url = f"https://raw.githubusercontent.com/nvm-sh/nvm/{self.NVM_VERSION}/install.sh"
            install_cmd = f"curl -o- {nvm_url} | bash"
            self.run_command(install_cmd, shell=True)
            return True
        except Exception as e:
            logger.error(f"Failed to install nvm: {e}")
            return False

    def _install_node(self) -> bool:
        """Install Node.js using nvm"""
        logger.info("Installing Node.js 24...")
        try:
            nvm_init = 'export NVM_DIR="$HOME/.nvm"'
            nvm_source = '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'
            install_cmd = f"{nvm_init} && {nvm_source} && nvm install 24"
            self.run_command(install_cmd, shell=True)
            return True
        except Exception as e:
            logger.error(f"Failed to install Node.js: {e}")
            return False


class PnpmInstaller(DependencyInstaller):
    """Handles pnpm installation"""

    def install(self) -> bool:
        if not self.check_command("npm"):
            nvm_cmd = (
                'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default'
            )
            self.run_command(nvm_cmd, shell=True, check=False)

            if not self.check_command("npm"):
                logger.error("Node.js/npm is required to install pnpm")
                return False

        logger.info("Installing pnpm globally...")
        try:
            self.run_command(["npm", "install", "-g", "pnpm"])
            return True
        except Exception as e:
            logger.error(f"Failed to install pnpm: {e}")
            return False


class UvInstaller(DependencyInstaller):
    """Handles uv installation"""

    def install(self) -> bool:
        if self.check_command("uv"):
            version = self.get_version("uv")
            logger.success(f"uv already installed: {version}")
            return True

        logger.info("Installing uv...")
        try:
            install_cmd = "curl -LsSf https://astral.sh/uv/install.sh | sh"
            self.run_command(install_cmd, shell=True)

            uv_bin = os.path.expanduser("~/.cargo/bin")
            if uv_bin not in os.environ.get("PATH", ""):
                os.environ["PATH"] = f"{uv_bin}:{os.environ.get('PATH', '')}"

            return True
        except Exception as e:
            logger.error(f"Failed to install uv: {e}")
            return False


class VenvInstaller(DependencyInstaller):
    """Handles virtual environment setup"""

    def install(self) -> bool:
        venv_path = os.path.join(os.getcwd(), ".venv")

        if os.path.exists(venv_path):
            logger.success("Virtual environment already exists at .venv")
            return True

        if not self.check_command("uv"):
            logger.error("uv is required to create virtual environment")
            return False

        logger.info("Creating virtual environment with uv...")
        try:
            self.run_command(["uv", "venv", ".venv"])

            logger.info("Installing development dependencies...")
            self.run_command(["uv", "sync", "--dev"])

            logger.success("Virtual environment created at .venv")
            logger.info("Activate with: source .venv/bin/activate")
            return True
        except Exception as e:
            logger.error(f"Failed to setup virtual environment: {e}")
            return False


class SqlxInstaller(DependencyInstaller):
    """Handles SQLx CLI installation"""

    def install(self) -> bool:
        if not self.check_command("cargo"):
            logger.error("Rust/Cargo is required to install SQLx CLI")
            return False

        logger.info("Installing SQLx CLI...")
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
            logger.error(f"Failed to install SQLx CLI: {e}")
            return False


class FirefoxInstaller(DependencyInstaller):
    """Handles Firefox installation check"""

    def install(self) -> bool:
        if self.check_command("firefox") or os.path.exists("/Applications/Firefox.app"):
            logger.success("Firefox is already installed")
            return True

        logger.warning("Firefox not found")

        if self.os_type == OSType.MACOS and self.check_command("brew"):
            if self.dry_run:
                logger.info("[DRY RUN] Would prompt to install Firefox via Homebrew")
                return True
            response = input("Would you like to install Firefox via Homebrew? (y/N) ")
            if response.lower() == "y":
                logger.info("Installing Firefox...")
                try:
                    self.run_command(["brew", "install", "--cask", "firefox"])
                    return True
                except Exception as e:
                    logger.error(f"Failed to install Firefox: {e}")
                    return False

        logger.warning("Please install Firefox 126+ from https://www.mozilla.org/firefox/")
        return False


class SqliteChecker(DependencyInstaller):
    """Checks SQLite installation"""

    def install(self) -> bool:
        if self.check_command("sqlite3"):
            version = self.get_version("sqlite3")
            logger.success(f"SQLite is installed: {version}")
            return True

        logger.warning("SQLite not found. Please install SQLite 3.40+ using your system package manager:")
        if self.os_type == OSType.LINUX:
            logger.warning("  Ubuntu/Debian: sudo apt-get install sqlite3")
            logger.warning("  Fedora/RHEL: sudo dnf install sqlite")
            logger.warning("  Arch: sudo pacman -S sqlite")
        elif self.os_type == OSType.MACOS:
            logger.warning("  macOS: brew install sqlite")
        return False


class ShellcheckInstaller(DependencyInstaller):
    """Handles shellcheck installation"""

    def install(self) -> bool:
        if self.check_command("shellcheck"):
            version = self.get_version("shellcheck")
            logger.success(f"shellcheck already installed: {version}")
            return True

        logger.info("Installing shellcheck...")
        try:
            if self.os_type == OSType.MACOS:
                if self.check_command("brew"):
                    self.run_command(["brew", "install", "shellcheck"])
                    return True
                else:
                    logger.error("Homebrew is required to install shellcheck on macOS")
                    return False
            elif self.os_type == OSType.LINUX:
                # Try different package managers
                if self.check_command("apt-get"):
                    self.run_command(["sudo", "apt-get", "update"], check=False)
                    self.run_command(["sudo", "apt-get", "install", "-y", "shellcheck"])
                    return True
                elif self.check_command("dnf"):
                    self.run_command(["sudo", "dnf", "install", "-y", "shellcheck"])
                    return True
                elif self.check_command("pacman"):
                    self.run_command(["sudo", "pacman", "-S", "--noconfirm", "shellcheck"])
                    return True
                else:
                    logger.error("No supported package manager found for Linux")
                    return False
        except Exception as e:
            logger.error(f"Failed to install shellcheck: {e}")
            return False


class ShfmtInstaller(DependencyInstaller):
    """Handles shfmt installation"""

    def install(self) -> bool:
        if self.check_command("shfmt"):
            version = self.get_version("shfmt")
            logger.success(f"shfmt already installed: {version}")
            return True

        logger.info("Installing shfmt...")
        try:
            if self.os_type == OSType.MACOS:
                if self.check_command("brew"):
                    self.run_command(["brew", "install", "shfmt"])
                    return True
                else:
                    logger.error("Homebrew is required to install shfmt on macOS")
                    return False
            elif self.os_type == OSType.LINUX:
                # Install via go for Linux
                if self.check_command("go"):
                    self.run_command(["go", "install", "mvdan.cc/sh/v3/cmd/shfmt@latest"])
                    # Add go bin to PATH if needed
                    go_bin = os.path.expanduser("~/go/bin")
                    if go_bin not in os.environ.get("PATH", ""):
                        os.environ["PATH"] = f"{go_bin}:{os.environ.get('PATH', '')}"
                    return True
                else:
                    logger.warning("Go is required to install shfmt on Linux")
                    logger.warning("Install Go first or use your package manager if shfmt is available")
                    return False
        except Exception as e:
            logger.error(f"Failed to install shfmt: {e}")
            return False


class PodmanInstaller(DependencyInstaller):
    """Handles Podman installation"""

    def install(self) -> bool:
        if self.check_command("podman"):
            version = self.get_version("podman")
            logger.success(f"Podman already installed: {version}")
            return True

        logger.info("Installing Podman...")
        try:
            if self.os_type == OSType.MACOS:
                if self.check_command("brew"):
                    self.run_command(["brew", "install", "podman"])
                    # Initialize podman machine on macOS
                    self._init_podman_machine()
                    return True
                else:
                    logger.error("Homebrew is required to install Podman on macOS")
                    return False
            elif self.os_type == OSType.LINUX:
                # Try different package managers
                if self.check_command("apt-get"):
                    self.run_command(["sudo", "apt-get", "update"], check=False)
                    self.run_command(["sudo", "apt-get", "install", "-y", "podman"])
                    return True
                elif self.check_command("dnf"):
                    self.run_command(["sudo", "dnf", "install", "-y", "podman"])
                    return True
                elif self.check_command("pacman"):
                    self.run_command(["sudo", "pacman", "-S", "--noconfirm", "podman"])
                    return True
                else:
                    logger.error("No supported package manager found for Linux")
                    return False
        except Exception as e:
            logger.error(f"Failed to install Podman: {e}")
            return False

    def _init_podman_machine(self) -> None:
        """Initialize podman machine on macOS"""
        if self.os_type != OSType.MACOS:
            return

        logger.info("Initializing podman machine...")
        try:
            # Check if machine exists
            result = self.run_command(["podman", "machine", "list"], capture=True)
            if "podman-machine-default" not in result.stdout:
                self.run_command(["podman", "machine", "init"])

            # Start machine
            self.run_command(["podman", "machine", "start"])
        except Exception as e:
            logger.warning(f"Podman machine initialization: {e}")


class ActInstaller(DependencyInstaller):
    """Handles act installation for GitHub Actions testing"""

    def install(self) -> bool:
        if self.check_command("act"):
            version = self.get_version("act")
            logger.success(f"act already installed: {version}")
            self._create_actrc()
            return True

        logger.info("Installing act...")
        try:
            if self.os_type == OSType.MACOS:
                if self.check_command("brew"):
                    self.run_command(["brew", "install", "act"])
                    self._create_actrc()
                    return True
                else:
                    logger.error("Homebrew is required to install act on macOS")
                    return False
            elif self.os_type == OSType.LINUX:
                # Use the official install script
                install_script = "curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
                self.run_command(install_script, shell=True)
                self._create_actrc()
                return True
        except Exception as e:
            logger.error(f"Failed to install act: {e}")
            return False

    def _create_actrc(self) -> None:
        """Create .actrc configuration for Podman"""
        actrc_path = os.path.expanduser("~/.actrc")

        if os.path.exists(actrc_path):
            logger.info(".actrc already exists")
            return

        logger.info("Creating .actrc configuration...")

        # Get podman socket path
        socket_path = "/run/user/1000/podman/podman.sock"  # Linux default
        if self.os_type == OSType.MACOS:
            try:
                result = self.run_command(
                    ["podman", "machine", "inspect", "--format", "{{.ConnectionInfo.PodmanSocket.Path}}"], capture=True
                )
                if result.stdout:
                    socket_path = result.stdout.strip()
            except Exception:
                pass

        config = f"""# act configuration for Podman
--container-daemon-socket unix://{socket_path}
--container-architecture linux/amd64
"""

        try:
            with open(actrc_path, "w") as f:
                f.write(config)
            logger.success(f"Created {actrc_path}")
        except Exception as e:
            logger.error(f"Failed to create .actrc: {e}")


class PythonInstaller(DependencyInstaller):
    """Handles Python installation using uv"""

    REQUIRED_VERSION = "3.12"

    def install(self) -> bool:
        # First check if uv is available
        if not self.check_command("uv"):
            logger.error("uv is required to install Python. Please install uv first.")
            return False

        # Check if the required Python version is already installed via uv
        try:
            result = self.run_command(["uv", "python", "list"])
            if result.stdout and f"cpython-{self.REQUIRED_VERSION}" in result.stdout:
                logger.success(f"Python {self.REQUIRED_VERSION} already installed via uv")
                return True
        except Exception:
            pass

        # Install Python using uv
        logger.info(f"Installing Python {self.REQUIRED_VERSION} using uv...")
        try:
            self.run_command(["uv", "python", "install", self.REQUIRED_VERSION])
            logger.success(f"Python {self.REQUIRED_VERSION} installed successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to install Python {self.REQUIRED_VERSION}: {e}")

            # Fallback to system Python check
            for cmd in ["python3", "python"]:
                if self.check_command(cmd):
                    version = self.get_version(cmd)
                    import re

                    match = re.search(r"Python (\d+\.\d+)", version)
                    if match:
                        installed_version = match.group(1)
                        if float(installed_version) >= float(self.REQUIRED_VERSION):
                            logger.info(f"System Python {installed_version} found and meets requirements")
                            return True

            logger.warning("Could not install or find suitable Python version")
            return False


class SetupManager:
    """Manages dependency installation"""

    # Single source of truth for dependency names and categories
    DEPENDENCY_NAMES = {
        "rust": "dev",
        "node": "dev",
        "pnpm": "dev",
        "sqlx": "dev",
        "uv": "dev",
        "python": "dev",
        "venv": "env",
        "sqlite": "sys",
        "firefox": "sys",
        "shellcheck": "dev",
        "shfmt": "dev",
        "podman": "dev",
        "act": "dev",
    }

    def __init__(self, dry_run: bool = False):
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
            logger.error(f"Unsupported OS: {system}")
            sys.exit(1)

    def _create_installers(self) -> dict[str, DependencyInstaller]:
        """Create installer instances"""
        return {
            "rust": RustInstaller(self.os_type, self.dry_run),
            "node": NodeInstaller(self.os_type, self.dry_run),
            "pnpm": PnpmInstaller(self.os_type, self.dry_run),
            "sqlx": SqlxInstaller(self.os_type, self.dry_run),
            "sqlite": SqliteChecker(self.os_type, self.dry_run),
            "firefox": FirefoxInstaller(self.os_type, self.dry_run),
            "uv": UvInstaller(self.os_type, self.dry_run),
            "python": PythonInstaller(self.os_type, self.dry_run),
            "venv": VenvInstaller(self.os_type, self.dry_run),
            "shellcheck": ShellcheckInstaller(self.os_type, self.dry_run),
            "shfmt": ShfmtInstaller(self.os_type, self.dry_run),
            "podman": PodmanInstaller(self.os_type, self.dry_run),
            "act": ActInstaller(self.os_type, self.dry_run),
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
            "python": Dependency(name="python", depends_on=["uv"], check_cmd="uv python"),
            "venv": Dependency(name="venv", depends_on=["python", "uv"]),
            "shellcheck": Dependency(name="shellcheck", check_cmd="shellcheck"),
            "shfmt": Dependency(name="shfmt", check_cmd="shfmt"),
            "podman": Dependency(name="podman", check_cmd="podman"),
            "act": Dependency(name="act", depends_on=["podman"], check_cmd="act"),
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
            logger.error(f"No installer for {name}")
            return False

        dep = self.dependencies.get(name)
        if dep and dep.check_cmd and installer.check_command(dep.check_cmd):
            version = installer.get_version(dep.check_cmd, dep.version_flag)
            self.installed[name] = version
            return True

        if installer.install():
            self.installed[name] = "installed"
            return True
        else:
            self.failed.add(name)
            return False

    def setup(self, requested: set[str]) -> None:
        """Run the setup process"""
        logger.info(f"Detected OS: {self.os_type.value}")
        if self.dry_run:
            logger.info("Running in DRY RUN mode - no changes will be made")

        to_install = self.resolve_dependencies(requested)
        logger.debug(f"Dependencies to install: {to_install}")

        for dep in to_install:
            self.install_dependency(dep)

        self.print_summary(requested)

    def print_summary(self, requested: set[str]) -> None:
        """Print installation summary"""
        print()
        if self.dry_run:
            logger.info("Dry run complete! (no changes were made)")
        else:
            logger.info("Setup complete!")
        print()

        # Group dependencies by category
        dev_deps = [name for name, cat in self.DEPENDENCY_NAMES.items() if cat == "dev"]
        env_deps = [name for name, cat in self.DEPENDENCY_NAMES.items() if cat == "env"]
        sys_deps = [name for name, cat in self.DEPENDENCY_NAMES.items() if cat == "sys"]

        self._print_group("Development dependencies:", dev_deps, requested)
        self._print_group("Python environment:", env_deps, requested)
        self._print_group("System dependencies:", sys_deps, requested)

        print()
        logger.header("Next steps")
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
    all_deps = set(SetupManager.DEPENDENCY_NAMES.keys())

    if args.include:
        includes = []
        for item in args.include:
            includes.extend(item.split(","))
        return set(includes)

    deps = all_deps.copy()
    if args.exclude:
        excludes = []
        for item in args.exclude:
            excludes.extend(item.split(","))
        deps -= set(excludes)

    return deps


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    """Add the setup-dev subcommand"""
    # Generate dependency list from single source of truth
    dep_names = ", ".join(sorted(SetupManager.DEPENDENCY_NAMES.keys()))
    parser = subparsers.add_parser(
        "setup-dev",
        help="Install development dependencies",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Examples:
  tanaka setup-dev                      # Install all prerequisites
  tanaka setup-dev --include rust node  # Install only Rust and Node.js
  tanaka setup-dev --exclude pnpm       # Install everything except pnpm
  tanaka setup-dev --debug              # Run with debug output
  tanaka setup-dev --dry-run            # Show what would be done without making changes

Available dependencies: {dep_names}
        """,
    )

    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )
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

    parser.set_defaults(func=run)


def run(args: argparse.Namespace) -> TaskResult:
    """Run the setup-dev command"""
    if args.debug:
        os.environ["DEBUG"] = "1"

    try:
        deps = parse_dependencies(args)
        manager = SetupManager(dry_run=args.dry_run)
        manager.setup(deps)
        return TaskResult(success=True, message="Setup completed successfully", exit_code=EXIT_SUCCESS)

    except ValueError as e:
        message = str(e)
        logger.error(message)
        return TaskResult(success=False, message=message, exit_code=EXIT_FAILURE)
    except KeyboardInterrupt:
        message = "Setup interrupted by user"
        logger.warning(message)
        return TaskResult(success=False, message=message, exit_code=EXIT_SIGINT)
    except Exception as e:
        message = f"Setup failed: {e}"
        logger.error(message)
        if args.debug:
            import traceback

            traceback.print_exc()
        return TaskResult(success=False, message=message, exit_code=EXIT_FAILURE)
