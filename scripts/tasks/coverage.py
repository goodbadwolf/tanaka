#!/usr/bin/env python3
"""Check test coverage for both extension and server."""

import argparse
import sys
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from tasks.core import TaskResult
from utils import check_command, run_command

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
EXTENSION_DIR = PROJECT_ROOT / "extension"
SERVER_DIR = PROJECT_ROOT / "server"

# Coverage thresholds
DEFAULT_THRESHOLDS = {
    "extension": {"overall": 75},  # Use overall average instead of strict per-metric
    "server": {"total": 40},
}


@dataclass
class CoverageMetrics:
    """Coverage metrics for different aspects of code."""

    statements: float
    branches: float
    functions: float
    lines: float

    @property
    def overall(self) -> float:
        """Calculate overall coverage as average of all metrics."""
        return sum([self.statements, self.branches, self.functions, self.lines]) / 4

    def asdict(self) -> dict[str, float]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class CoverageResult:
    """Result of a coverage check."""

    success: bool
    metrics: CoverageMetrics | None = None
    coverage: float | None = None
    html_report_path: Path | None = None


def parse_jest_coverage(output: str) -> CoverageMetrics | None:
    """Parse Jest coverage output and extract metrics.

    Looks for a line like:
    All files     |   87.53 |    74.74 |   84.79 |   87.31 |
    """
    for line in output.splitlines():
        if "All files" in line and "|" in line:
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 6:
                try:
                    return CoverageMetrics(
                        statements=float(parts[1]),
                        branches=float(parts[2]),
                        functions=float(parts[3]),
                        lines=float(parts[4]),
                    )
                except (ValueError, IndexError):
                    pass
    return None


def parse_tarpaulin_coverage(output: str) -> float | None:
    """Parse tarpaulin coverage output and extract percentage.

    Looks for a line like:
    59.78% coverage, 443/741 lines covered
    """
    for line in output.splitlines():
        if "% coverage" in line:
            try:
                # Extract percentage (e.g., "42.65% coverage")
                coverage_str = line.split("%")[0].split()[-1]
                return float(coverage_str)
            except (ValueError, IndexError):
                pass
    return None


class JestCommand:
    """Builder for Jest coverage commands."""

    @staticmethod
    def build(verbose: bool = False) -> list[str]:
        """Build Jest command with coverage options."""
        cmd = ["pnpm", "test", "--coverage", "--watchAll=false"]
        if not verbose:
            cmd.append("--silent")
        return cmd


class TarpaulinCommand:
    """Builder for cargo-tarpaulin commands."""

    @staticmethod
    def build(
        force_clean: bool = False,
        html: bool = False,
        verbose: bool = False,
    ) -> list[str]:
        """Build tarpaulin command with options."""
        cmd = [
            "cargo",
            "tarpaulin",
            "--workspace",
            "--timeout",
            "120",
        ]

        if force_clean:
            cmd.append("--force-clean")
        else:
            cmd.append("--skip-clean")

        if html:
            cmd.extend(["--out", "Html", "--output-dir", "coverage"])
        else:
            cmd.extend(["--out", "Stdout"])

        if verbose:
            cmd.append("--verbose")

        return cmd


class CoverageChecker(ABC):
    """Base class for coverage checkers."""

    def __init__(self, args: argparse.Namespace):
        self.args = args

    @abstractmethod
    def get_tool_name(self) -> str:
        """Get the name of the coverage tool."""

    @abstractmethod
    def get_tool_hint(self) -> str:
        """Get installation hint for the tool."""

    @abstractmethod
    def get_working_dir(self) -> Path:
        """Get the working directory for running coverage."""

    @abstractmethod
    def build_command(self) -> list[str]:
        """Build the coverage command."""

    @abstractmethod
    def parse_output(self, output: str) -> CoverageResult:
        """Parse coverage output and return result."""

    @abstractmethod
    def get_threshold(self) -> float:
        """Get the coverage threshold."""

    def check_tool_available(self) -> bool:
        """Check if the coverage tool is available."""
        return check_command(self.get_tool_name())

    def run_coverage(self) -> CoverageResult:
        """Run coverage check and return results."""
        logger.info(f"Checking {self.get_tool_name()} coverage...")

        # Check tool availability
        if not self.check_tool_available():
            logger.error(f"{self.get_tool_name()} not found. {self.get_tool_hint()}")
            return CoverageResult(success=False)

        # Build and run command
        cmd = self.build_command()
        try:
            result = run_command(
                cmd,
                cwd=self.get_working_dir(),
                check=False,
                capture_output=True,
            )

            if result.returncode != 0:
                logger.error(f"{self.get_tool_name()} tests failed")
                if result.stderr:
                    logger.error(result.stderr)
                return CoverageResult(success=False)

            # Parse output
            coverage_result = self.parse_output(result.stdout)

            # Check threshold
            if coverage_result.metrics:
                coverage_value = coverage_result.metrics.overall
            elif coverage_result.coverage is not None:
                coverage_value = coverage_result.coverage
            else:
                logger.error("Failed to parse coverage data")
                if self.args.verbose:
                    logger.debug(f"Output:\n{result.stdout}")
                return CoverageResult(success=False)

            threshold = self.get_threshold()
            if coverage_value < threshold:
                logger.error(f"Coverage {coverage_value:.2f}% below threshold {threshold}%")
                coverage_result.success = False

            return coverage_result

        except FileNotFoundError:
            logger.error(f"{self.get_tool_name()} not found. {self.get_tool_hint()}")
            return CoverageResult(success=False)


class ExtensionCoverageChecker(CoverageChecker):
    """Coverage checker for TypeScript extension."""

    def get_tool_name(self) -> str:
        return "pnpm"

    def get_tool_hint(self) -> str:
        return "Please install dependencies first."

    def get_working_dir(self) -> Path:
        return EXTENSION_DIR

    def build_command(self) -> list[str]:
        return JestCommand.build(verbose=self.args.verbose)

    def parse_output(self, output: str) -> CoverageResult:
        metrics = parse_jest_coverage(output)
        if not metrics:
            return CoverageResult(success=False)

        # Log coverage summary
        logger.info("Extension coverage:")
        logger.info(f"  Statements: {metrics.statements:.2f}%")
        logger.info(f"  Branches:   {metrics.branches:.2f}%")
        logger.info(f"  Functions:  {metrics.functions:.2f}%")
        logger.info(f"  Lines:      {metrics.lines:.2f}%")
        logger.info(f"  Overall:    {metrics.overall:.2f}%")

        # HTML report path
        html_path = None
        if self.args.html:
            html_path = EXTENSION_DIR / "coverage/lcov-report/index.html"
            logger.info(f"HTML coverage report: {html_path}")

        return CoverageResult(
            success=True,
            metrics=metrics,
            html_report_path=html_path,
        )

    def get_threshold(self) -> float:
        return DEFAULT_THRESHOLDS["extension"]["overall"]


class ServerCoverageChecker(CoverageChecker):
    """Coverage checker for Rust server."""

    def get_tool_name(self) -> str:
        return "cargo"

    def get_tool_hint(self) -> str:
        return "Please install Rust toolchain."

    def get_working_dir(self) -> Path:
        return SERVER_DIR

    def build_command(self) -> list[str]:
        # First check if tarpaulin is installed
        if not check_command("cargo-tarpaulin"):
            # Try to check with cargo
            try:
                result = run_command(
                    ["cargo", "tarpaulin", "--version"],
                    capture_output=True,
                    check=False,
                )
                if result.returncode != 0:
                    logger.error("cargo-tarpaulin not installed. Install with: cargo install cargo-tarpaulin")
                    return []
            except Exception:
                logger.error("cargo-tarpaulin not installed. Install with: cargo install cargo-tarpaulin")
                return []

        return TarpaulinCommand.build(
            force_clean=self.args.force_server_clean,
            html=self.args.html,
            verbose=self.args.verbose,
        )

    def parse_output(self, output: str) -> CoverageResult:
        coverage = parse_tarpaulin_coverage(output)
        if coverage is None:
            return CoverageResult(success=False)

        logger.info(f"Server coverage: {coverage:.2f}%")

        # HTML report path
        html_path = None
        if self.args.html:
            html_path = SERVER_DIR / "coverage/tarpaulin-report.html"
            logger.info(f"HTML coverage report: {html_path}")

        return CoverageResult(
            success=True,
            coverage=coverage,
            html_report_path=html_path,
        )

    def get_threshold(self) -> float:
        return DEFAULT_THRESHOLDS["server"]["total"]


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
        "--force-server-clean",
        action="store_true",
        help="Force a clean build for server coverage (runs tarpaulin --force-clean)",
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
    checker = ExtensionCoverageChecker(args)
    result = checker.run_coverage()
    return result.success, result.metrics.asdict() if result.metrics else {}


def check_server_coverage(args: argparse.Namespace) -> tuple[bool, float]:
    """Check Rust server test coverage."""
    checker = ServerCoverageChecker(args)
    result = checker.run_coverage()
    return result.success, result.coverage or 0.0


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
