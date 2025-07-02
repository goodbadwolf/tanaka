#!/usr/bin/env python3
"""Check test coverage for both extension and server."""

import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from tasks.core import TaskResult

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
EXTENSION_DIR = PROJECT_ROOT / "extension"
SERVER_DIR = PROJECT_ROOT / "server"

# Coverage thresholds
DEFAULT_THRESHOLDS = {
    "extension": {"overall": 80},  # Use overall average instead of strict per-metric
    "server": {"total": 80},
}


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    """Add the coverage subcommand."""
    parser = subparsers.add_parser(
        "coverage",
        help="Check test coverage for extension and server",
        description="Run test coverage analysis for both TypeScript extension and Rust server",
    )
    parser.add_argument(
        "--extension",
        action="store_true",
        help="Check extension coverage only",
    )
    parser.add_argument(
        "--server",
        action="store_true",
        help="Check server coverage only",
    )
    parser.add_argument(
        "--html",
        action="store_true",
        help="Generate HTML coverage reports",
    )
    parser.add_argument(
        "--fail-under",
        type=int,
        help="Fail if total coverage is below this percentage (default: 80)",
        default=80,
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed coverage output",
    )
    parser.set_defaults(func=run)


def check_extension_coverage(args: argparse.Namespace) -> tuple[bool, dict[str, float]]:
    """Check TypeScript extension test coverage."""
    logger.info("Checking extension test coverage...")

    # Run Jest with coverage
    cmd = ["pnpm", "test", "--coverage", "--watchAll=false"]
    if not args.verbose:
        cmd.append("--silent")

    try:
        result = subprocess.run(
            cmd,
            cwd=EXTENSION_DIR,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error("Extension tests failed")
            logger.error(result.stderr)
            return False, {}

        # Parse coverage from output
        coverage_data = {}
        for line in result.stdout.splitlines():
            if "All files" in line and "|" in line:
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 6:
                    try:
                        coverage_data = {
                            "statements": float(parts[1]),
                            "branches": float(parts[2]),
                            "functions": float(parts[3]),
                            "lines": float(parts[4]),
                        }
                        break
                    except (ValueError, IndexError):
                        pass

        # Show coverage summary
        if coverage_data:
            overall_coverage = sum(coverage_data.values()) / len(coverage_data)
            logger.info("Extension coverage:")
            logger.info(f"  Statements: {coverage_data['statements']:.2f}%")
            logger.info(f"  Branches:   {coverage_data['branches']:.2f}%")
            logger.info(f"  Functions:  {coverage_data['functions']:.2f}%")
            logger.info(f"  Lines:      {coverage_data['lines']:.2f}%")
            logger.info(f"  Overall:    {overall_coverage:.2f}%")

            # Check overall threshold (average of all metrics)
            threshold = DEFAULT_THRESHOLDS["extension"]["overall"]

            if overall_coverage < threshold:
                logger.error(f"Extension overall coverage {overall_coverage:.2f}% below threshold {threshold}%")
                return False, coverage_data

            # Generate HTML report if requested
            if args.html:
                logger.info(f"HTML coverage report: {EXTENSION_DIR / 'coverage/lcov-report/index.html'}")

            return True, coverage_data
        else:
            logger.error("Failed to parse coverage data")
            if args.verbose:
                logger.debug(f"Jest output:\n{result.stdout}")
            return False, {}

    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to run extension tests: {e}")
        return False, {}
    except FileNotFoundError:
        logger.error("pnpm not found. Please install dependencies first.")
        return False, {}


def check_server_coverage(args: argparse.Namespace) -> tuple[bool, float]:
    """Check Rust server test coverage."""
    logger.info("Checking server test coverage...")

    # Check if cargo-tarpaulin is installed
    try:
        subprocess.run(
            ["cargo", "tarpaulin", "--version"],
            capture_output=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("cargo-tarpaulin not installed. Install with: cargo install cargo-tarpaulin")
        return False, 0.0

    # Run cargo-tarpaulin
    cmd = [
        "cargo",
        "tarpaulin",
        "--workspace",
        "--all-features",
        "--timeout",
        "120",
    ]

    if args.html:
        cmd.extend(["--out", "Html", "--output-dir", "coverage"])
    else:
        cmd.extend(["--out", "Stdout"])

    if args.verbose:
        cmd.append("--verbose")

    try:
        result = subprocess.run(
            cmd,
            cwd=SERVER_DIR,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error("Server coverage check failed")
            logger.error(result.stderr)
            return False, 0.0

        # Parse coverage percentage from output
        coverage = 0.0
        for line in result.stdout.splitlines():
            if "% coverage" in line:
                try:
                    # Extract percentage (e.g., "42.65% coverage")
                    coverage_str = line.split("%")[0].split()[-1]
                    coverage = float(coverage_str)
                    break
                except (ValueError, IndexError):
                    pass

        if coverage > 0:
            logger.info(f"Server coverage: {coverage:.2f}%")

            if args.html:
                logger.info(f"HTML coverage report: {SERVER_DIR / 'coverage/tarpaulin-report.html'}")

            # Check threshold
            threshold = DEFAULT_THRESHOLDS["server"]["total"]
            if coverage < threshold:
                logger.error(f"Server coverage {coverage:.2f}% below threshold {threshold}%")
                return False, coverage

            return True, coverage
        else:
            logger.error("Failed to parse coverage data")
            if args.verbose:
                logger.debug(f"Tarpaulin output:\n{result.stdout}")
            return False, 0.0

    except FileNotFoundError:
        logger.error("cargo not found. Please install Rust toolchain.")
        return False, 0.0


def run(args: argparse.Namespace) -> TaskResult:
    """Run coverage checks."""
    check_both = not args.extension and not args.server
    success = True
    results = {}

    # Check extension coverage
    if args.extension or check_both:
        ext_success, ext_coverage = check_extension_coverage(args)
        success = success and ext_success
        results["extension"] = ext_coverage

    # Check server coverage
    if args.server or check_both:
        srv_success, srv_coverage = check_server_coverage(args)
        success = success and srv_success
        results["server"] = srv_coverage

    # Summary
    if check_both and results:
        logger.info("\n" + "=" * 50)
        logger.info("Coverage Summary:")
        if "extension" in results and results["extension"]:
            avg_ext = sum(results["extension"].values()) / len(results["extension"])
            logger.info(f"  Extension: {avg_ext:.2f}% average")
        if "server" in results:
            logger.info(f"  Server:    {results['server']:.2f}%")
        logger.info("=" * 50)

    if success:
        return TaskResult(success=True, message="Coverage checks passed", exit_code=EXIT_SUCCESS)
    else:
        return TaskResult(
            success=False, message="Coverage checks failed - some targets below threshold", exit_code=EXIT_FAILURE
        )
