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
from utils import check_command, find_extension_dir, find_server_dir, run_command

DEFAULT_THRESHOLDS = {
    "extension": {"overall": 75},  # Use overall average instead of strict per-metric
    "server": {"total": 40},
}


@dataclass
class CoverageMetrics:
    statements: float
    branches: float
    functions: float
    lines: float

    @property
    def overall(self) -> float:
        return sum([self.statements, self.branches, self.functions, self.lines]) / 4

    def asdict(self) -> dict[str, float]:
        return asdict(self)


@dataclass
class CoverageResult:
    success: bool
    metrics: CoverageMetrics | None = None
    coverage: float | None = None
    html_report_path: Path | None = None


def parse_jest_coverage(output: str) -> CoverageMetrics | None:
    for line in output.splitlines():
        # Looks for a line like:
        # All files     |   87.53 |    74.74 |   84.79 |   87.31 |
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


def parse_llvm_cov_coverage(output: str) -> float | None:
    # Looks for a TOTAL line with coverage percentages.
    # The line coverage is typically the third percentage value.
    for line in output.splitlines():
        if line.strip().startswith("TOTAL") and "%" in line:
            try:
                # Extract the line coverage percentage (third percentage in the TOTAL line)
                parts = line.split()
                # Find all percentage values
                percentages = [p for p in parts if p.endswith("%")]
                if len(percentages) >= 3:
                    # Line coverage is typically the third percentage
                    coverage_str = percentages[2].rstrip("%")
                    return float(coverage_str)
            except (ValueError, IndexError):
                pass
    return None


class JestCommand:
    @staticmethod
    def build(verbose: bool = False) -> list[str]:
        cmd = ["pnpm", "test", "--coverage", "--watchAll=false"]
        if not verbose:
            cmd.append("--silent")
        return cmd


class LlvmCovCommand:
    @staticmethod
    def build(
        force_clean: bool = False,
        html: bool = False,
        verbose: bool = False,
    ) -> list[str]:
        cmd = [
            "cargo",
            "llvm-cov",
            "--workspace",
        ]

        if force_clean:
            cmd.append("--clean")

        if html:
            cmd.append("--html")

        if verbose:
            cmd.append("--verbose")

        return cmd


class CoverageChecker(ABC):
    def __init__(self, args: argparse.Namespace):
        self.args = args

    @abstractmethod
    def get_tool_name(self) -> str:
        pass

    @abstractmethod
    def get_tool_hint(self) -> str:
        pass

    @abstractmethod
    def get_working_dir(self) -> Path:
        pass

    @abstractmethod
    def build_command(self) -> list[str]:
        pass

    @abstractmethod
    def parse_output(self, output: str) -> CoverageResult:
        pass

    @abstractmethod
    def get_threshold(self) -> float:
        pass

    def check_tool_available(self) -> bool:
        return check_command(self.get_tool_name())

    def run_coverage(self) -> CoverageResult:
        logger.info(f"Checking {self.get_tool_name()} coverage...")

        if not self.check_tool_available():
            logger.error(f"{self.get_tool_name()} not found. {self.get_tool_hint()}")
            return CoverageResult(success=False)

        cmd = self.build_command()
        if not cmd:
            return CoverageResult(success=False)

        try:
            result = run_command(
                cmd,
                cwd=self.get_working_dir(),
                check=False,
                capture_output=True,
                stream_output=True,
            )

            if result.returncode != 0:
                logger.error(f"{self.get_tool_name()} tests failed")
                if result.stderr:
                    logger.error(result.stderr)
                return CoverageResult(success=False)

            coverage_result = self.parse_output(result.stdout)

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
    def get_tool_name(self) -> str:
        return "pnpm"

    def get_tool_hint(self) -> str:
        return "Please install dependencies first."

    def get_working_dir(self) -> Path:
        return find_extension_dir()

    def build_command(self) -> list[str]:
        return JestCommand.build(verbose=self.args.verbose)

    def parse_output(self, output: str) -> CoverageResult:
        metrics = parse_jest_coverage(output)
        if not metrics:
            return CoverageResult(success=False)

        logger.info("Extension coverage:")
        logger.info(f"  Statements: {metrics.statements:.2f}%")
        logger.info(f"  Branches:   {metrics.branches:.2f}%")
        logger.info(f"  Functions:  {metrics.functions:.2f}%")
        logger.info(f"  Lines:      {metrics.lines:.2f}%")
        logger.info(f"  Overall:    {metrics.overall:.2f}%")

        html_path = None
        if self.args.html:
            html_path = find_extension_dir() / "coverage/lcov-report/index.html"
            logger.info(f"HTML coverage report: {html_path}")

        return CoverageResult(
            success=True,
            metrics=metrics,
            html_report_path=html_path,
        )

    def get_threshold(self) -> float:
        return DEFAULT_THRESHOLDS["extension"]["overall"]


class ServerCoverageChecker(CoverageChecker):
    def get_tool_name(self) -> str:
        return "cargo"

    def get_tool_hint(self) -> str:
        return "Please install Rust toolchain."

    def get_working_dir(self) -> Path:
        return find_server_dir()

    def build_command(self) -> list[str]:
        if not check_command("cargo-llvm-cov"):
            try:
                result = run_command(
                    ["cargo", "llvm-cov", "--version"],
                    capture_output=True,
                    check=False,
                )
                if result.returncode != 0:
                    logger.error("cargo-llvm-cov not installed. Install with: cargo install cargo-llvm-cov --locked")
                    return []
            except Exception:
                logger.error("cargo-llvm-cov not installed. Install with: cargo install cargo-llvm-cov --locked")
                return []

        return LlvmCovCommand.build(
            force_clean=self.args.force_server_clean,
            html=self.args.html,
            verbose=self.args.verbose,
        )

    def parse_output(self, output: str) -> CoverageResult:
        coverage = parse_llvm_cov_coverage(output)
        if coverage is None:
            return CoverageResult(success=False)

        logger.info(f"Server coverage: {coverage:.2f}%")

        html_path = None
        if self.args.html:
            html_path = find_server_dir() / "target/llvm-cov/html/index.html"
            logger.info(f"HTML coverage report: {html_path}")

        return CoverageResult(
            success=True,
            coverage=coverage,
            html_report_path=html_path,
        )

    def get_threshold(self) -> float:
        return DEFAULT_THRESHOLDS["server"]["total"]


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
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
        help="Force a clean build for server coverage (runs llvm-cov --clean)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed coverage output",
    )
    parser.set_defaults(func=run)


def check_extension_coverage(args: argparse.Namespace) -> tuple[bool, dict[str, float]]:
    checker = ExtensionCoverageChecker(args)
    result = checker.run_coverage()
    return result.success, result.metrics.asdict() if result.metrics else {}


def check_server_coverage(args: argparse.Namespace) -> tuple[bool, float]:
    checker = ServerCoverageChecker(args)
    result = checker.run_coverage()
    return result.success, result.coverage or 0.0


def run(args: argparse.Namespace) -> TaskResult:
    check_both = not args.extension and not args.server
    success = True
    results = {}

    if args.extension or check_both:
        ext_success, ext_coverage = check_extension_coverage(args)
        success = success and ext_success
        results["extension"] = ext_coverage

    if args.server or check_both:
        srv_success, srv_coverage = check_server_coverage(args)
        success = success and srv_success
        results["server"] = srv_coverage

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
