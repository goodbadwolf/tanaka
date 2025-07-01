"""Shared utilities for task scripts"""

import os
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
    capture_output: bool = False,
) -> subprocess.CompletedProcess:
    """Run a command with logging

    Args:
        cmd: Command and arguments to run
        cwd: Working directory for the command
        check: Whether to raise on non-zero exit code
        env: Environment variables (if None, inherits current environment)
        capture_output: Whether to capture stdout and stderr

    Returns:
        CompletedProcess instance

    Raises:
        FileNotFoundError: If command is not found
        CalledProcessError: If command fails and check=True
    """
    logger.info(f"Running: {' '.join(cmd)}")
    try:
        return subprocess.run(cmd, cwd=cwd, check=check, capture_output=capture_output, text=True, env=env)
    except FileNotFoundError:
        logger.error(f"Command not found: {cmd[0]}")
        raise
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        raise


def check_command(cmd: str) -> bool:
    """Check if a command exists in PATH"""
    return shutil.which(cmd) is not None


def env_with(**env_vars: str | None) -> dict[str, str]:
    """Get environment variables with additional variables set

    Args:
        **env_vars: Keyword arguments for environment variables to set
                    None values are ignored

    Returns:
        Copy of current environment with specified variables set

    Example:
        >>> env = env_with(DOCKER_HOST="unix:///path/to/socket", FOO="bar")
        >>> env = env_with(DOCKER_HOST=docker_host)  # None values ignored
    """
    env = os.environ.copy()
    for key, value in env_vars.items():
        if value is not None:
            env[key] = value
    return env
