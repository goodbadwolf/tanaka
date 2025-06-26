#!/usr/bin/env python3
"""
Quick Mode Support for pre-commit
==================================

Provides a wrapper to skip expensive checks when PRE_COMMIT_QUICK=1 is set.
This mimics the quick mode functionality from the Husky setup.
"""

import os
import subprocess
import sys


def should_skip_expensive_check(hook_id: str) -> bool:
    """Determine if a hook should be skipped in quick mode."""
    # Expensive checks to skip in quick mode
    expensive_hooks = {
        "typescript",  # TypeScript compilation
        "clippy",  # Rust clippy (can be slow)
        "cargo-test",  # Rust tests
        "jest",  # JavaScript tests
    }

    return os.environ.get("PRE_COMMIT_QUICK") == "1" and hook_id in expensive_hooks


def main():
    """Wrapper for conditional hook execution."""
    if len(sys.argv) < 2:
        print("Usage: quick_mode.py <hook-id> <command> [args...]")
        sys.exit(1)

    hook_id = sys.argv[1]
    command = sys.argv[2:]

    if should_skip_expensive_check(hook_id):
        print(f"⚡ Skipping {hook_id} (quick mode)")
        return 0

    # Run the actual command
    return subprocess.call(command)


if __name__ == "__main__":
    sys.exit(main())
