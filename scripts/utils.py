"""Shared utilities for task scripts"""

import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from logger import logger


def run_command(
    cmd: list[str],
    cwd: Path | None = None,
    check: bool = True,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    """Run a command with logging

    Args:
        cmd: Command and arguments to run
        cwd: Working directory for the command
        check: Whether to raise on non-zero exit code
        env: Environment variables (if None, inherits current environment)

    Returns:
        CompletedProcess instance

    Raises:
        FileNotFoundError: If command is not found
        CalledProcessError: If command fails and check=True
    """
    logger.info(f"Running: {' '.join(cmd)}")
    try:
        return subprocess.run(cmd, cwd=cwd, check=check, capture_output=False, text=True, env=env)
    except FileNotFoundError:
        logger.error(f"Command not found: {cmd[0]}")
        raise
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        raise


def check_command(cmd: str) -> bool:
    """Check if a command exists in PATH"""
    return shutil.which(cmd) is not None
