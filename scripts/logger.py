"""Simple color logger for terminal output"""

import os
import sys


class Logger:
    COLORS = {
        "reset": "\033[0m",
        "red": "\033[31m",
        "green": "\033[32m",
        "yellow": "\033[33m",
        "blue": "\033[34m",
        "cyan": "\033[36m",
        "bold": "\033[1m",
    }

    def __init__(self, use_color: bool | None = None):
        if use_color is None:
            self.use_color = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
        else:
            self.use_color = use_color

    def _format(self, message: str, *colors: str) -> str:
        if self.use_color:
            prefix = "".join(self.COLORS.get(c, "") for c in colors)
            if prefix:
                return f"{prefix}{message}{self.COLORS['reset']}"
        return message

    def info(self, message: str) -> None:
        print(self._format(message, "blue"))

    def success(self, message: str) -> None:
        print(self._format(f"✓ {message}", "green"))

    def warning(self, message: str) -> None:
        print(self._format(f"⚠ {message}", "yellow"), file=sys.stderr)

    def error(self, message: str) -> None:
        print(self._format(f"✗ {message}", "red"), file=sys.stderr)

    def debug(self, message: str) -> None:
        if os.environ.get("DEBUG"):
            print(self._format(f"[DEBUG] {message}", "cyan"))

    def header(self, message: str) -> None:
        print(self._format(f"\n{message}\n{'─' * len(message)}", "bold"))

    def step(self, number: int, total: int, message: str) -> None:
        """Log a step in a multi-step process"""
        print(self._format(f"[{number}/{total}] {message}", "cyan"))


logger = Logger()
