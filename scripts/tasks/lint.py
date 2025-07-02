import argparse
import fnmatch
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from glob import glob

from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from utils import run_command

from .core import TaskResult


def lint_markdown(fix: bool = False, patterns_to_ignore: set[str] | None = None) -> int:
    if not patterns_to_ignore:
        patterns_to_ignore = set(["repomix-output.txt.md", ".venv/*"])

    action = "fix" if fix else "scan"
    logger.info(f"Running markdown linter ({action} mode)")

    md_files = []

    for f in glob("*.md"):
        for ignore in patterns_to_ignore:
            if any(fnmatch.fnmatch(f, ignore) for ignore in patterns_to_ignore):
                continue
            md_files.append(f)

    for f in glob("docs/*.md"):
        for ignore in patterns_to_ignore:
            if any(fnmatch.fnmatch(f, ignore) for ignore in patterns_to_ignore):
                continue
            md_files.append(f)

    md_files = list(set(md_files))

    if not md_files:
        logger.info("No markdown files to lint")
        return 0

    logger.debug(f"Linting files: {md_files}")

    cmd = [
        "uv",
        "run",
        "pymarkdown",
        action,
    ] + md_files

    try:
        run_command(cmd)
        logger.success("Markdown linting passed")
        return 0
    except Exception:
        return 1


def lint_python(fix: bool = False) -> int:
    mode = "fix" if fix else "check"
    logger.info(f"Running Python linters ({mode} mode)")

    errors = 0

    ruff_cmd = ["uv", "run", "ruff", "check", "scripts/"]
    if fix:
        ruff_cmd.append("--fix")
    try:
        run_command(ruff_cmd)
        logger.success("Ruff check passed")
    except Exception:
        errors += 1

    black_cmd = ["uv", "run", "black"]
    if not fix:
        black_cmd.append("--check")
    black_cmd.append("scripts/")
    try:
        run_command(black_cmd)
        logger.success("Black formatting check passed")
    except Exception:
        errors += 1

    return 1 if errors else 0


def run(args: argparse.Namespace) -> TaskResult:
    if args.markdown:
        exit_code = lint_markdown(fix=args.fix)
        message = "Markdown linting completed" if exit_code == 0 else "Markdown linting failed"
        return TaskResult(
            success=exit_code == 0,
            message=message,
            exit_code=exit_code if exit_code else EXIT_SUCCESS,
        )
    elif args.python:
        exit_code = lint_python(fix=args.fix)
        message = "Python linting completed" if exit_code == 0 else "Python linting failed"
        return TaskResult(
            success=exit_code == 0,
            message=message,
            exit_code=exit_code if exit_code else EXIT_SUCCESS,
        )
    else:
        logger.header("Running all linters")
        errors = 0
        errors += lint_markdown(fix=args.fix)
        errors += lint_python(fix=args.fix)

        if errors:
            message = f"Linting failed with {errors} error(s)"
            logger.error(message)
            return TaskResult(success=False, message=message, exit_code=EXIT_FAILURE)
        else:
            message = "All linting checks passed!"
            logger.success(message)
            return TaskResult(success=True, message=message, exit_code=EXIT_SUCCESS)


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "lint",
        help="Run linting checks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  tanaka lint               # Run all linters
  tanaka lint --fix         # Fix all auto-fixable issues
  tanaka lint --python      # Run only Python linters
  tanaka lint --markdown    # Run only markdown linter
  tanaka lint -p --fix      # Fix Python issues only
        """,
    )
    parser.add_argument("--fix", action="store_true", help="Fix issues automatically")
    parser.add_argument("--markdown", "-m", action="store_true", help="Lint only markdown files")
    parser.add_argument("--python", "-p", action="store_true", help="Lint only Python files")
    parser.set_defaults(func=run)
