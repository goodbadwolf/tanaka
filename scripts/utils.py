"""Shared utilities for task scripts"""

import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path
from typing import IO, TextIO, TypeVar

sys.path.insert(0, str(Path(__file__).parent))
from logger import logger


def clean_terminal_output(text: str) -> str:
    """Clean terminal control characters from text output.

    Handles carriage returns (\r) that are used for progress indicators
    and in-place updates, producing clean text suitable for logging.

    Args:
        text: Raw text containing terminal control characters

    Returns:
        Cleaned text with carriage return overwrites resolved
    """
    lines = []
    current_line = []

    for char in text:
        if char == "\r":
            # Carriage return: clear current line buffer
            current_line = []
        elif char == "\n":
            # Newline: save current line and start new one
            lines.append("".join(current_line))
            current_line = []
        else:
            current_line.append(char)

    # Don't forget any remaining content
    if current_line:
        lines.append("".join(current_line))

    return "\n".join(lines)


def process_and_display_stream(
    stream: IO[bytes],
    display_stream: TextIO | None = None,
    output_file: TextIO | None = None,
    prefix: str = "",
    clean_output: bool = True,
) -> str:
    """Process a stream, optionally displaying it and/or saving to file.

    Args:
        stream: Input stream to process
        display_stream: Stream to display output to (e.g., sys.stdout), None to suppress
        output_file: Optional file to write cleaned output to
        prefix: Optional prefix for each line (useful for labeling stderr)
        clean_output: Whether to clean terminal control characters from captured output

    Returns:
        The captured output (cleaned if clean_output=True)
    """
    captured_text = []

    while True:
        # Read one byte at a time to preserve real-time progress output
        # (buffered reading would delay carriage return updates)
        byte = stream.read(1)
        if not byte:
            break

        # Decode byte to character
        try:
            char = byte.decode("utf-8", errors="replace")
        except Exception:
            continue

        captured_text.append(char)

        # Display to terminal if requested
        if display_stream:
            # Add prefix after newlines for better line labeling
            if char == "\n" and prefix:
                display_stream.write(char + prefix)
            else:
                display_stream.write(char)
            display_stream.flush()

    # Join captured text
    raw_output = "".join(captured_text)

    # Clean output if requested
    final_output = clean_terminal_output(raw_output) if clean_output else raw_output

    # Write to file if requested
    if output_file:
        output_file.write(final_output)
        output_file.flush()

    return final_output


def run_command(
    cmd: list[str],
    cwd: Path | None = None,
    check: bool = True,
    env: dict[str, str] | None = None,
    capture_output: bool = False,
    stream_output: bool = False,
    stderr_prefix: str = "[stderr] ",
    timeout: float | None = None,
) -> subprocess.CompletedProcess:
    """Run a command with logging

    Args:
        cmd: Command and arguments to run
        cwd: Working directory for the command
        check: Whether to raise on non-zero exit code
        env: Environment variables (if None, inherits current environment)
        capture_output: Whether to capture stdout and stderr
        stream_output: Whether to stream output in real-time while cleaning terminal control characters
        stderr_prefix: Prefix to add to stderr lines when streaming (default: "[stderr] ")
        timeout: Maximum time to wait for command completion in seconds (None for no timeout)

    Returns:
        CompletedProcess instance

    Raises:
        FileNotFoundError: If command is not found
        CalledProcessError: If command fails and check=True
        subprocess.TimeoutExpired: If timeout is reached

    Note:
        When stream_output is True, the function displays raw output to the terminal
        (including progress bars) while capturing a cleaned version that resolves
        carriage return overwrites for logging purposes.
    """
    logger.info(f"Running: {' '.join(cmd)}")

    try:
        if stream_output:
            # Streaming mode with real-time output
            process = subprocess.Popen(
                cmd,
                cwd=cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,  # Unbuffered
            )

            # Process streams in parallel
            stdout_output = ""
            stderr_output = ""

            def process_stdout():
                nonlocal stdout_output
                if process.stdout:
                    stdout_output = process_and_display_stream(
                        process.stdout, display_stream=sys.stdout, clean_output=True
                    )

            def process_stderr():
                nonlocal stderr_output
                if process.stderr:
                    stderr_output = process_and_display_stream(
                        process.stderr, display_stream=sys.stderr, prefix=stderr_prefix, clean_output=True
                    )

            # Start threads to process streams
            stdout_thread = threading.Thread(target=process_stdout, daemon=True)
            stderr_thread = threading.Thread(target=process_stderr, daemon=True)
            stdout_thread.start()
            stderr_thread.start()

            try:
                # Wait for process to complete with timeout
                returncode = process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                process.kill()
                raise
            finally:
                # Ensure threads are always cleaned up
                stdout_thread.join(timeout=1.0)
                stderr_thread.join(timeout=1.0)

            # Create CompletedProcess object
            result = subprocess.CompletedProcess(
                args=cmd,
                returncode=returncode,
                stdout=stdout_output if capture_output else None,
                stderr=stderr_output if capture_output else None,
            )
        else:
            # Non-streaming mode (original behavior)
            result = subprocess.run(
                cmd, cwd=cwd, check=False, capture_output=capture_output, text=True, env=env, timeout=timeout
            )

        # Unified error handling
        if check and result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd, output=result.stdout, stderr=result.stderr)

        return result

    except FileNotFoundError:
        logger.error(f"Command not found: {cmd[0]} (working directory: {cwd or Path.cwd()})")
        raise
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {' '.join(cmd)} (exit code: {e.returncode}, cwd: {cwd or Path.cwd()})")
        raise
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out after {timeout}s: {' '.join(cmd)}")
        raise


def check_command(cmd: str) -> bool:
    """Check if a command exists in PATH

    Args:
        cmd: Command name to check (e.g., 'git', 'docker')

    Returns:
        True if command is found in PATH, False otherwise
    """
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


def find_project_root(marker: str = ".git") -> Path | None:
    """Find project root by looking for a marker file or directory

    Args:
        marker: File or directory name to look for (default: ".git")

    Returns:
        Path to project root if found, None otherwise
    """
    current_dir = Path.cwd()

    # First check current directory
    if (current_dir / marker).exists():
        return current_dir

    # Walk up the directory tree
    for parent in current_dir.parents:
        if (parent / marker).exists():
            return parent

    return None


def find_extension_dir() -> Path | None:
    """Find the extension directory

    Returns:
        Path to extension directory if found, None otherwise
    """
    project_root = find_project_root()
    if not project_root:
        return None
    return project_root / "extension"


def find_server_dir() -> Path | None:
    """Find the server directory

    Returns:
        Path to server directory if found, None otherwise
    """
    project_root = find_project_root()
    if not project_root:
        return None
    return project_root / "server"


SetOnceType = TypeVar("SetOnceType")


class SetOnce[SetOnceType]:
    """A value that can only be set once, with an associated reason.

    Useful for tracking why a decision was made, where multiple conditions
    might trigger the same outcome but we only care about the first one.
    """

    def __init__(self):
        self._value: SetOnceType | None = None
        self._reason = ""
        self._is_set = False

    def set(self, value: SetOnceType, reason: str) -> None:
        if not self._is_set:
            self._value = value
            self._reason = reason
            self._is_set = True

    def get(self) -> SetOnceType | None:
        return self._value

    @property
    def reason(self) -> str:
        return self._reason

    @property
    def is_set(self) -> bool:
        return self._is_set

    def __str__(self) -> str:
        return self._reason

    def __repr__(self) -> str:
        return f"SetOnce(value={self._value!r}, reason={self._reason!r}, is_set={self._is_set})"
