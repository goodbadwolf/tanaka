#!/usr/bin/env python3
"""
Documentation Update Checker
============================

Reminds developers to update docs when making significant changes.
"""

import subprocess
import sys


def get_staged_files() -> set[str]:
    """Get list of staged files."""
    result = subprocess.run(["git", "diff", "--cached", "--name-only"], capture_output=True, text=True, check=True)
    return set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()


def check_documentation() -> int:
    """Check if documentation might need updating based on changed files."""
    staged_files = get_staged_files()
    if not staged_files:
        return 0

    # Files that might need doc updates when changed
    config_files = {"Cargo.toml", "package.json", "manifest.json", "example.toml"}
    api_patterns = {"server/src/routes/", "server/src/models/"}
    build_configs = {"rspack.config", "vite.config", "webpack.config"}

    # Check what changed
    config_changed = any(any(cf in f for cf in config_files) for f in staged_files)
    api_changed = any(any(ap in f for ap in api_patterns) and f.endswith(".rs") for f in staged_files)
    build_changed = any(any(bc in f for bc in build_configs) for f in staged_files)

    # Count major source changes
    source_extensions = {".ts", ".tsx", ".rs"}
    major_source_changes = sum(1 for f in staged_files if any(f.endswith(ext) for ext in source_extensions))

    # Check if docs are already being updated
    doc_files_updated = any("README.md" in f or "DEV.md" in f or "INSTALL.md" in f for f in staged_files)

    suggestions = []

    if config_changed:
        suggestions.extend(["  - DEV.md (new commands, dependencies)", "  - INSTALL.md (if config format changed)"])

        # Check for version changes
        if any(f in ["manifest.json", "Cargo.toml"] for f in staged_files):
            suggestions.append("  - README.md (version/feature status)")

    if api_changed:
        suggestions.append("  - DEV.md (API endpoint documentation)")

    if build_changed:
        suggestions.append("  - DEV.md (build process changes)")

    # Only show if we have significant changes and docs aren't being updated
    if major_source_changes > 5 and not doc_files_updated and suggestions:
        print("\n⚠️  Documentation reminder")
        print("You're making significant changes. Consider updating:")
        for suggestion in suggestions:
            print(suggestion)
        print("\nPer CLAUDE.md: 'Always check and update relevant documentation'")
        print("(This is a non-blocking reminder)\n")

    return 0  # Always return 0 - this is non-blocking


if __name__ == "__main__":
    sys.exit(check_documentation())
