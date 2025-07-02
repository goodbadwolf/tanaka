"""Test CI command - Test GitHub Actions workflows locally using act and Podman"""

import argparse
import os
import platform
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants import EXIT_FAILURE, EXIT_SUCCESS
from logger import logger
from utils import check_command, env_with, run_command

from .core import TaskResult


def setup_podman_docker_host() -> str | None:
    system = platform.system()

    if system == "Darwin":  # macOS
        try:
            result = run_command(
                ["podman", "machine", "inspect", "--format", "{{.ConnectionInfo.PodmanSocket.Path}}"],
                capture_output=True,
            )
            socket_path = result.stdout.strip()
            if socket_path:
                docker_host = f"unix://{socket_path}"
                logger.info(f"Docker host set to: {docker_host}")
                return docker_host
        except subprocess.CalledProcessError:
            logger.warning("Failed to get Podman socket path")
    elif system == "Linux":
        if os.environ.get("DOCKER_HOST"):
            return os.environ.get("DOCKER_HOST")

        try:
            result = run_command(
                ["podman", "info", "--format", "{{.Host.RemoteSocket.Path}}"],
                capture_output=True,
            )
            socket_path = result.stdout.strip()
            if socket_path:
                docker_host = f"unix://{socket_path}"
                logger.info(f"Docker host set to: {docker_host}")
                return docker_host
        except subprocess.CalledProcessError:
            xdg_runtime = os.environ.get("XDG_RUNTIME_DIR", f"/run/user/{os.getuid()}")
            socket_path = f"{xdg_runtime}/podman/podman.sock"
            if os.path.exists(socket_path):
                docker_host = f"unix://{socket_path}"
                logger.info(f"Docker host set to: {docker_host}")
                return docker_host

    # Windows typically doesn't need DOCKER_HOST as Podman listens to the default pipe
    return None


def start_podman_machine(env: dict[str, str], timeout: int = 60) -> bool:
    try:
        result = run_command(
            ["podman", "machine", "list", "--format", "{{.Name}}"],
            env=env,
            capture_output=True,
        )
        machines = result.stdout.strip().split("\n") if result.stdout.strip() else []

        if not machines or machines == [""]:
            logger.info("No Podman machine found. Initializing a new machine...")
            try:
                run_command(["podman", "machine", "init"], env=env)
                logger.info("Podman machine initialized successfully")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to initialize Podman machine: {e}")
                return False
    except subprocess.CalledProcessError:
        logger.warning("Failed to list machines, attempting to initialize...")
        try:
            run_command(["podman", "machine", "init"], env=env)
        except subprocess.CalledProcessError:
            pass

    logger.info("Starting Podman machine...")

    try:
        run_command(["podman", "machine", "start"], env=env)
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start Podman machine: {e}")
        return False

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            result = run_command(
                ["podman", "machine", "list", "--format", "{{.Running}}"],
                env=env,
                capture_output=True,
            )
            if result.stdout.strip().lower() == "true":
                logger.success("Podman machine started successfully")
                return True
        except subprocess.CalledProcessError:
            pass

        time.sleep(2)

    logger.error(f"Podman machine failed to start within {timeout} seconds")
    return False


def check_prerequisites(auto_start: bool = True, timeout: int = 60) -> tuple[TaskResult, dict[str, str]]:
    logger.info("Checking prerequisites...")

    missing = []

    if not check_command("act"):
        missing.append("act")

    if not check_command("podman"):
        missing.append("podman")

    if missing:
        message = f"Missing required tools: {', '.join(missing)}\n"
        message += "Run 'python3 scripts/tanaka.py setup-dev --include act podman' to install them"
        return TaskResult(success=False, message=message, exit_code=EXIT_FAILURE), {}

    docker_host = setup_podman_docker_host()
    env = env_with(DOCKER_HOST=docker_host)

    machine_exists = False
    machine_running = False

    try:
        result = run_command(
            ["podman", "machine", "list", "--format", "{{.Name}}"],
            env=env,
            capture_output=True,
        )
        machines = result.stdout.strip().split("\n") if result.stdout.strip() else []
        machine_exists = bool(machines and machines != [""])

        if machine_exists:
            result = run_command(
                ["podman", "machine", "list", "--format", "{{.Running}}"],
                env=env,
                capture_output=True,
            )
            machine_running = result.stdout.strip().lower() == "true"
    except subprocess.CalledProcessError:
        # If list command fails, assume no machine exists
        pass

    if not machine_exists or not machine_running:
        if auto_start:
            if not machine_exists:
                logger.warning("No Podman machine found. Creating and starting one...")
            else:
                logger.warning("Podman machine is not running. Attempting to start it...")

            if start_podman_machine(env, timeout=timeout):
                docker_host = setup_podman_docker_host()
                env = env_with(DOCKER_HOST=docker_host)
                return TaskResult(success=True, message="All prerequisites satisfied (Podman machine started)"), env
            else:
                return (
                    TaskResult(
                        success=False,
                        message="Failed to start Podman machine. Try running: podman machine start",
                        exit_code=EXIT_FAILURE,
                    ),
                    env,
                )
        else:
            return (
                TaskResult(
                    success=False,
                    message="Podman is installed but not running. Run: podman machine start",
                    exit_code=EXIT_FAILURE,
                ),
                env,
            )

    return TaskResult(success=True, message="All prerequisites satisfied"), env


def get_workflow_files() -> list[Path]:
    workflows_dir = Path.cwd() / ".github" / "workflows"
    if not workflows_dir.exists():
        return []

    return list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))


def test_workflows(
    workflow: str | None = None,
    dry_run: bool = False,
    verbose: bool = False,
    auto_start: bool = True,
    timeout: int = 60,
) -> TaskResult:
    """Test GitHub Actions workflows locally"""

    prereq_result, env = check_prerequisites(auto_start=auto_start, timeout=timeout)
    if not prereq_result.success:
        return prereq_result

    workflows = get_workflow_files()
    if not workflows:
        return TaskResult(
            success=False, message="No workflow files found in .github/workflows/", exit_code=EXIT_FAILURE
        )

    if workflow:
        workflow_path = Path(".github/workflows") / workflow
        if workflow_path not in workflows:
            return TaskResult(success=False, message=f"Workflow not found: {workflow}", exit_code=EXIT_FAILURE)
        workflows = [workflow_path]

    logger.header(f"Testing {len(workflows)} workflow(s)")

    act_args = ["act"]

    act_args.extend(["-P", "ubuntu-latest=catthehacker/ubuntu:act-latest"])

    # Disable socket bind mounting to avoid Podman issues
    # This is especially important on macOS but can help on other platforms too
    act_args.extend(["--container-daemon-socket", "-"])

    if dry_run:
        act_args.append("--dryrun")

    if verbose:
        act_args.append("-v")

    failed = []
    for workflow_file in workflows:
        logger.info(f"Testing {workflow_file.name}...")

        try:
            cmd = act_args + ["-W", str(workflow_file)]
            run_command(cmd, env=env)
            logger.success(f"✓ {workflow_file.name} passed")
        except subprocess.CalledProcessError as e:
            logger.error(f"✗ {workflow_file.name} failed: {e}")
            failed.append(workflow_file.name)

    if failed:
        return TaskResult(success=False, message=f"Failed workflows: {', '.join(failed)}", exit_code=EXIT_FAILURE)

    return TaskResult(success=True, message=f"All {len(workflows)} workflow(s) passed", exit_code=EXIT_SUCCESS)


def test_ci_main(args: argparse.Namespace) -> TaskResult:
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

    return test_workflows(
        workflow=args.workflow,
        dry_run=args.dry_run,
        verbose=args.verbose,
        auto_start=not args.no_auto_start,
        timeout=args.timeout,
    )


def add_subparser(subparsers) -> None:
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

    parser.add_argument(
        "--no-auto-start", action="store_true", help="Don't automatically start Podman machine if it's not running"
    )

    parser.add_argument(
        "--timeout", type=int, default=60, help="Timeout in seconds for starting Podman machine (default: 60)"
    )

    parser.set_defaults(func=test_ci_main)


main = test_ci_main
