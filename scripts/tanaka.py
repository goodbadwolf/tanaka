#!/usr/bin/env python3
"""
Tanaka Development Script
Central command interface for development tasks
"""

import argparse
import importlib
import sys
import traceback
from collections.abc import Callable
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from constants import EXIT_FAILURE, EXIT_SIGINT
from logger import logger


class Task:
    def __init__(self, name: str, module_name: str | None = None):
        self.name = name
        self.module_name = module_name or name
        self._module: Any | None = None
        self._loaded = False

    def load(self) -> bool:
        if self._loaded:
            return self._module is not None

        try:
            self._module = importlib.import_module(f"tasks.{self.module_name}")
            self._loaded = True
            return True
        except ImportError as e:
            logger.warning(f"Could not load tasks.{self.module_name}: {e}")
            logger.debug(f"Traceback: {traceback.format_exc()}")
            self._module = None
            self._loaded = True
            return False

    @property
    def module(self) -> Any | None:
        if not self._loaded:
            self.load()
        return self._module

    def add_subparser(self, subparsers: argparse._SubParsersAction) -> None:
        if self.module and hasattr(self.module, "add_subparser"):
            self.module.add_subparser(subparsers)
        elif self.module:
            logger.warning(f"tasks.{self.module_name} missing add_subparser function")

    def get_runner(self) -> Callable[[Any], int] | None:
        if self.module and hasattr(self.module, "run"):
            return self.module.run
        return None


def discover_tasks() -> list[Task]:
    """Discover all task modules dynamically"""
    tasks_dir = Path(__file__).parent / "tasks"
    if not tasks_dir.exists():
        return []

    task_files = tasks_dir.glob("*.py")
    tasks = []
    for file in sorted(task_files):
        if file.stem not in ["__init__", "core"]:
            # Convert file name to command name (e.g., setup_dev -> setup-dev)
            command_name = file.stem.replace("_", "-")
            tasks.append(Task(command_name, file.stem))
    return tasks


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tanaka",
        description="Tanaka Development Tasks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Use 'tanaka <command> --help' for command-specific help.",
    )

    return parser


def main() -> int:
    tasks = discover_tasks()
    parser = create_parser()
    subparsers = parser.add_subparsers(dest="command", help="Available commands", metavar="<command>")

    for task in tasks:
        task.add_subparser(subparsers)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return EXIT_FAILURE

    try:
        result = args.func(args)
        if result.success:
            logger.success(result.message)
        else:
            logger.error(result.message)
        return result.exit_code
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        return EXIT_SIGINT
    except Exception as e:
        logger.error(str(e))
        return EXIT_FAILURE


if __name__ == "__main__":
    sys.exit(main())
