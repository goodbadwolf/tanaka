"""Test CI command - Test GitHub Actions workflows locally using act and Podman"""

import argparse
import os
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from utils import run_command

from .core import TaskResult


def check_command_exists(command: str) -> bool:
    """Check if a command exists in PATH"""
    return shutil.which(command) is not None


def check_prerequisites() -> TaskResult:
    """Check if act and podman are installed"""
    logger.info("Checking prerequisites...")

    missing = []

    if not check_command_exists("act"):
        missing.append("act")

    if not check_command_exists("podman"):
        missing.append("podman")

    if missing:
        message = f"Missing required tools: {', '.join(missing)}\n"
        message += "Run 'python3 scripts/tanaka.py setup-dev --include act podman' to install them"
        return TaskResult(success=False, message=message, exit_code=EXIT_FAILURE)

    # Check if podman is running
    try:
        run_command(["podman", "machine", "list"], capture_output=True)
    except Exception:
        return TaskResult(
            success=False,
            message="Podman is installed but not running. Run: podman machine start",
            exit_code=EXIT_FAILURE,
        )

    return TaskResult(success=True, message="All prerequisites satisfied")


def get_workflow_files() -> list[Path]:
    """Get all workflow files"""
    workflows_dir = Path.cwd() / ".github" / "workflows"
    if not workflows_dir.exists():
        return []

    return list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))


def test_workflows(workflow: str | None = None, dry_run: bool = False, verbose: bool = False) -> TaskResult:
    """Test GitHub Actions workflows locally"""

    # Check prerequisites first
    prereq_result = check_prerequisites()
    if not prereq_result.success:
        return prereq_result

    workflows = get_workflow_files()
    if not workflows:
        return TaskResult(
            success=False, message="No workflow files found in .github/workflows/", exit_code=EXIT_FAILURE
        )

    # Filter to specific workflow if requested
    if workflow:
        workflow_path = Path(".github/workflows") / workflow
        if workflow_path not in workflows:
            return TaskResult(success=False, message=f"Workflow not found: {workflow}", exit_code=EXIT_FAILURE)
        workflows = [workflow_path]

    logger.header(f"Testing {len(workflows)} workflow(s)")

    # Prepare act command
    act_args = ["act"]

    # Use smaller image for faster testing
    act_args.extend(["-P", "ubuntu-latest=catthehacker/ubuntu:act-latest"])

    if dry_run:
        act_args.append("--dryrun")

    if verbose:
        act_args.append("-v")

    # Test each workflow
    failed = []
    for workflow_file in workflows:
        logger.info(f"Testing {workflow_file.name}...")

        try:
            # Run act for this workflow
            cmd = act_args + ["-W", str(workflow_file)]
            run_command(cmd)
            logger.success(f"✓ {workflow_file.name} passed")
        except Exception as e:
            logger.error(f"✗ {workflow_file.name} failed: {e}")
            failed.append(workflow_file.name)

    if failed:
        return TaskResult(success=False, message=f"Failed workflows: {', '.join(failed)}", exit_code=EXIT_FAILURE)

    return TaskResult(success=True, message=f"All {len(workflows)} workflow(s) passed", exit_code=EXIT_SUCCESS)


def test_ci_main(args: argparse.Namespace) -> TaskResult:
    """Main entry point for test-ci command"""

    # Skip in CI environment
    if os.environ.get("CI") == "true":
        logger.info("Skipping GitHub Actions testing in CI environment")
        return TaskResult(success=True, message="Skipped in CI")

    if args.check:
        # Only run if workflow files have been modified
        try:
            result = run_command(["git", "diff", "--cached", "--name-only"], capture_output=True)
            changed_files = result.stdout.strip().split("\n") if result.stdout else []

            workflow_changes = [f for f in changed_files if ".github/workflows/" in f]
            if not workflow_changes:
                logger.info("No workflow changes detected, skipping tests")
                return TaskResult(success=True, message="No workflow changes")
        except Exception:
            pass  # Continue with testing anyway

    return test_workflows(workflow=args.workflow, dry_run=args.dry_run, verbose=args.verbose)


def add_subparser(subparsers) -> None:
    """Add test-ci command parser"""
    parser = subparsers.add_parser(
        "test-ci",
        help="Test GitHub Actions workflows locally using act and Podman",
        description="Test GitHub Actions workflows locally before pushing",
    )

    parser.add_argument("--workflow", "-w", help="Test specific workflow file (e.g., ci.yml)")

    parser.add_argument(
        "--check", action="store_true", help="Only run if workflow files have been modified (for pre-commit)"
    )

    parser.add_argument("--dry-run", "-n", action="store_true", help="Show what would be run without executing")

    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")

    parser.set_defaults(func=test_ci_main)


# This is discovered by tanaka.py
main = test_ci_main
