#!/usr/bin/env python3
"""
TODO Tracking Checker
====================

Reminds developers to update TODO documentation when implementing features.
"""

import subprocess
import sys


def get_staged_files() -> set[str]:
    """Get list of staged files."""
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"], capture_output=True, text=True, check=True
    )
    return set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()


def check_todos() -> int:
    """Check if TODO documentation needs updating."""
    staged_files = get_staged_files()
    if not staged_files:
        return 0

    # Check if any source files are being modified
    source_extensions = {".ts", ".tsx", ".js", ".jsx", ".rs", ".py"}
    source_files = [f for f in staged_files if any(f.endswith(ext) for ext in source_extensions)]

    if not source_files:
        return 0

    # Check if TODO file is already being updated
    todo_files = [f for f in staged_files if "TODOS.md" in f]

    if todo_files:
        # TODO file is being updated, good!
        return 0

    # Only show reminder if working on significant changes
    if len(source_files) > 2:
        print("\n📋 Reminder: Working on TODO items?")
        print("Consider updating docs/TODOS.md if you've:")
        print("  - Completed any pending tasks")
        print("  - Discovered new work that should be tracked")
        print("")
        print("Per CLAUDE.md: Update TODO file as part of each PR")
        print("(This is a non-blocking reminder)\n")

    return 0  # Always return 0 - this is non-blocking


if __name__ == "__main__":
    # If filenames were passed by pre-commit, we can use them
    # Otherwise fall back to git diff
    if len(sys.argv) > 1:
        # Files passed as arguments
        source_extensions = {".ts", ".tsx", ".js", ".jsx", ".rs", ".py"}
        source_files = [f for f in sys.argv[1:] if any(f.endswith(ext) for ext in source_extensions)]
        if len(source_files) > 2:
            # Check if TODO file is in the commit
            result = subprocess.run(
                ["git", "diff", "--cached", "--name-only"], capture_output=True, text=True, check=True
            )
            all_staged = set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()
            todo_files = [f for f in all_staged if "TODOS.md" in f]

            if not todo_files:
                print("\n📋 Reminder: Working on TODO items?")
                print("Consider updating docs/TODOS.md if you've:")
                print("  - Completed any pending tasks")
                print("  - Discovered new work that should be tracked")
                print("")
                print("Per CLAUDE.md: Update TODO file as part of each PR")
                print("(This is a non-blocking reminder)\n")
    else:
        sys.exit(check_todos())
