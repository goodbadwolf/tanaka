"""Generate command - Code generation tasks"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from utils import run_command

from .core import TaskResult


def generate_api_models() -> TaskResult:
    """Generate TypeScript API models from Rust types"""
    logger.header("Generating TypeScript API models")

    # Find project root by looking for server directory
    project_root = Path.cwd()
    server_dir = project_root / "server"
    if not server_dir.exists():
        # Try parent directory
        project_root = Path.cwd().parent
        server_dir = project_root / "server"
        if not server_dir.exists():
            logger.error("Server directory not found")
            logger.info("Make sure you're running this from the project root")
            return TaskResult(success=False, message="Server directory not found", exit_code=EXIT_FAILURE)

    # Check if generated models are stale
    models_rs = server_dir / "src" / "models.rs"
    generated_dir = project_root / "extension" / "src" / "api" / "models" / "generated"
    sentinel_file = generated_dir / "Tab.ts"

    if not models_rs.exists():
        logger.error(f"Models file not found: {models_rs}")
        return TaskResult(success=False, message="Models file not found", exit_code=EXIT_FAILURE)

    # Check if regeneration is needed
    needs_regeneration = True
    if sentinel_file.exists():
        models_mtime = models_rs.stat().st_mtime
        sentinel_mtime = sentinel_file.stat().st_mtime
        if sentinel_mtime >= models_mtime:
            needs_regeneration = False

    if not needs_regeneration:
        logger.success("Generated model files are up-to-date")
        return TaskResult(success=True, message="Generated model files are up-to-date", exit_code=EXIT_SUCCESS)

    # Show why regeneration is needed
    if sentinel_file.exists():
        from datetime import datetime

        models_time = datetime.fromtimestamp(models_rs.stat().st_mtime)
        sentinel_time = datetime.fromtimestamp(sentinel_file.stat().st_mtime)
        logger.warning("Generated model files are stale. Regenerating...")
        logger.info(f"Generated model file date: {sentinel_time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"Model file date: {models_time.strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        logger.warning("No generated model files found. Generating...")

    # Remove old generated files
    if generated_dir.exists():
        logger.info("Removing previous model files...")
        for ts_file in generated_dir.glob("*.ts"):
            ts_file.unlink()

    # Create directory if it doesn't exist
    generated_dir.mkdir(parents=True, exist_ok=True)

    # Generate new model files
    logger.info("Generating model files...")
    env = os.environ.copy()
    env["TS_RS_EXPORT_DIR"] = str(generated_dir)

    try:
        run_command(["cargo", "test"], cwd=server_dir, env=env)
        return TaskResult(success=True, message="API models generated successfully", exit_code=EXIT_SUCCESS)
    except Exception as e:
        return TaskResult(success=False, message=f"Failed to generate API models: {e}", exit_code=EXIT_FAILURE)


def run(args: argparse.Namespace) -> TaskResult:
    """Main entry point for generate command"""
    if args.artifact == "api-models":
        return generate_api_models()
    else:
        return TaskResult(success=False, message=f"Unknown artifact: {args.artifact}", exit_code=EXIT_FAILURE)


def add_subparser(subparsers: argparse._SubParsersAction) -> None:
    """Add the generate subcommand to the parser"""
    parser: argparse.ArgumentParser = subparsers.add_parser(
        "generate",
        aliases=["gen"],
        help="Code generation tasks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  tanaka generate                # Generate TypeScript API models (default)
  tanaka generate api-models     # Generate TypeScript API models
  tanaka gen                     # Short alias for generate
        """,
    )
    parser.add_argument(
        "artifact",
        nargs="?",
        default="api-models",
        choices=["api-models"],
        help="Artifact to generate (default: api-models)",
    )
    parser.set_defaults(func=run)
