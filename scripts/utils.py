"""Shared utilities for task scripts"""

import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path
from typing import IO, TextIO

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
        # Read one byte at a time
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

    Returns:
        CompletedProcess instance

    Raises:
        FileNotFoundError: If command is not found
        CalledProcessError: If command fails and check=True

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
            stdout_thread = threading.Thread(target=process_stdout)
            stderr_thread = threading.Thread(target=process_stderr)
            stdout_thread.start()
            stderr_thread.start()

            # Wait for process to complete
            returncode = process.wait()
            stdout_thread.join()
            stderr_thread.join()

            # Create CompletedProcess object
            result = subprocess.CompletedProcess(
                args=cmd,
                returncode=returncode,
                stdout=stdout_output if capture_output else None,
                stderr=stderr_output if capture_output else None,
            )
        else:
            # Non-streaming mode (original behavior)
            result = subprocess.run(cmd, cwd=cwd, check=False, capture_output=capture_output, text=True, env=env)

        # Unified error handling
        if check and result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd, output=result.stdout, stderr=result.stderr)

        return result

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
