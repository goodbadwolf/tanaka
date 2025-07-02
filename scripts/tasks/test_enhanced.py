"""Enhanced testing with cargo-nextest and llvm-cov"""

import argparse
import subprocess
from pathlib import Path

from logger import logger
from tasks.core import run_command


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "test-enhanced",
        help="Run enhanced Rust tests with nextest and coverage",
        description="Use cargo-nextest for faster test execution and cargo-llvm-cov for better coverage reports",
    )
    parser.add_argument(
        "--coverage",
        action="store_true",
        help="Generate coverage report with cargo-llvm-cov",
    )
    parser.add_argument(
        "--html",
        action="store_true",
        help="Generate HTML coverage report (implies --coverage)",
    )
    parser.add_argument(
        "--no-fail-fast",
        action="store_true",
        help="Continue running tests after failures",
    )
    parser.add_argument(
        "--filter",
        help="Filter tests by name (passed to nextest)",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install required tools (nextest, llvm-cov)",
    )


def install_tools() -> bool:
    """Install cargo-nextest and cargo-llvm-cov if not present"""
    tools_to_install = []

    # Check if cargo-nextest is installed
    result = subprocess.run(
        ["cargo", "nextest", "--version"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        tools_to_install.append("cargo-nextest")

    # Check if cargo-llvm-cov is installed
    result = subprocess.run(
        ["cargo", "llvm-cov", "--version"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        tools_to_install.append("cargo-llvm-cov")

    if not tools_to_install:
        logger.info("All required tools are already installed")
        return True

    logger.info(f"Installing tools: {', '.join(tools_to_install)}")

    for tool in tools_to_install:
        if run_command(["cargo", "install", tool, "--locked"]) != 0:
            logger.error(f"Failed to install {tool}")
            return False

    return True


def run(args: argparse.Namespace) -> int:
    # Change to server directory
    server_dir = Path.cwd() / "server"
    if not server_dir.exists():
        logger.error("Server directory not found")
        return 1

    # Install tools if requested
    if args.install:
        if not install_tools():
            return 1

    # Check if nextest is available
    result = subprocess.run(
        ["cargo", "nextest", "--version"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.warning("cargo-nextest not found. Install with: cargo install cargo-nextest --locked")
        logger.info("Falling back to standard cargo test")
        return run_command(["cargo", "test", "--workspace"], cwd=server_dir)

    # Build the nextest command
    nextest_cmd = ["cargo", "nextest", "run", "--workspace"]

    if args.no_fail_fast:
        nextest_cmd.append("--no-fail-fast")

    if args.filter:
        nextest_cmd.extend(["--filter", args.filter])

    # Run tests with nextest
    logger.info("Running tests with cargo-nextest (2-3× faster)")
    test_result = run_command(nextest_cmd, cwd=server_dir)

    if test_result != 0:
        logger.error("Tests failed")
        if not args.coverage and not args.html:
            return test_result

    # Generate coverage if requested
    if args.coverage or args.html:
        # Check if llvm-cov is available
        result = subprocess.run(
            ["cargo", "llvm-cov", "--version"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.warning("cargo-llvm-cov not found. Install with: cargo install cargo-llvm-cov")
            return test_result

        logger.info("Generating coverage report with cargo-llvm-cov")

        cov_cmd = ["cargo", "llvm-cov", "--workspace"]

        if args.html:
            cov_cmd.append("--html")
            logger.info("HTML coverage report will be available at: server/target/llvm-cov/html/index.html")
        else:
            cov_cmd.extend(["--lcov", "--output-path", "lcov.info"])
            logger.info("Coverage report will be available at: server/lcov.info")

        cov_result = run_command(cov_cmd, cwd=server_dir)

        if cov_result != 0:
            logger.error("Failed to generate coverage report")
            return cov_result

    return test_result
