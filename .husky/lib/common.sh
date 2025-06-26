#!/bin/bash
#
# Common Functions and Utilities for Pre-commit Checkers
# ========================================================
#
# This file provides shared utilities used by all linting checker modules.
# It must be sourced before any checker scripts are loaded.
#
# Dependencies:
# -------------
# Requires: git, find, wc
# Optional: Python virtual environment in .venv/

# Get the project root directory (3 levels up from .husky/lib/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PROJECT_ROOT

# Global Variables:
# FIXES_APPLIED           - Flag indicating if any auto-fixes were applied
# ERRORS_FOUND            - Flag indicating if any errors need manual fixing
# PARTIAL_STAGING_WARNING - Flag indicating files were partially staged
FIXES_APPLIED=0
ERRORS_FOUND=0
PARTIAL_STAGING_WARNING=0

emit() {
    # Terminal-aware colored output function
    # Usage: emit <color> <message>
    # Colors: red, green, yellow, blue, gray, bold
    local color="$1"
    local message="$2"

    # Check if stdout is a terminal
    if [ -t 1 ]; then
        # Terminal - use color
        case "$color" in
        red) echo -e "\033[0;31m${message}\033[0m" ;;
        green) echo -e "\033[0;32m${message}\033[0m" ;;
        yellow) echo -e "\033[1;33m${message}\033[0m" ;;
        blue) echo -e "\033[0;34m${message}\033[0m" ;;
        gray) echo -e "\033[0;90m${message}\033[0m" ;;
        bold) echo -e "\033[1m${message}\033[0m" ;;
        *) echo "$message" ;; # No color for unknown
        esac
    else
        # Not a terminal (pipe, file, etc) - no color
        echo "$message"
    fi
}

# Logging functions using emit
debug() { [ "${DEBUG:-0}" = "1" ] && emit "gray" "$1"; }  # Gray debug messages (only if DEBUG=1)
info() { emit "blue" "$1"; }                               # Blue informational messages
warn() { emit "yellow" "$1"; }                             # Yellow warning messages
error() { emit "red" "$1"; }                               # Red error messages
success() { emit "green" "$1"; }                           # Green success messages
header() { emit "bold" "$1"; }                             # Bold section headers

log_stage_start() {
    # Log the start of a checker stage with formatting
    # Usage: log_stage_start "TypeScript Linting"
    local stage_name="$1"
    echo ""
    header "Stage ${stage_name}: Started"
    debug "────────────────────────────────────────"
}

log_stage_skip() {
    # Log when a stage is skipped with reason
    # Usage: log_stage_skip "TypeScript Linting" "no TypeScript files staged"
    local stage_name="$1"
    local reason="$2"
    echo ""
    header "Stage ${stage_name}: Skipped"
    debug "(${reason})"
}

log_stage_finish() {
    # Log the completion of a checker stage with result
    # Usage: log_stage_finish "TypeScript Linting" "PASSED|FAILED|FIXED|SKIPPED"
    local stage_name="$1"
    local result="$2"

    debug "────────────────────────────────────────"
    if [ "$result" = "FAILED" ]; then
        error "Stage ${stage_name}: Finished with ${result}"
    elif [ "$result" = "FIXED" ]; then
        warn "Stage ${stage_name}: Finished with ${result}"
    else
        success "Stage ${stage_name}: Finished with ${result}"
    fi
}

check_partial_staging() {
    # Check if file has both staged and unstaged changes
    # Returns: 0 if partially staged, 1 if fully staged or not staged
    local file="$1"
    # Check if file has both staged and unstaged changes
    if git diff --cached --name-only | grep -q "^$file$" &&
        git diff --name-only | grep -q "^$file$"; then
        return 0 # Partially staged
    fi
    return 1 # Fully staged or not staged
}

warn_partial_staging() {
    # Warn user about partially staged files that may be affected by auto-fixes
    # Usage: warn_partial_staging "$STAGED_FILES"
    local files="$1"
    local any_partial=0

    for file in $files; do
        if check_partial_staging "$file"; then
            if [ $any_partial -eq 0 ]; then
                warn "Partially staged files detected:"
                any_partial=1
                PARTIAL_STAGING_WARNING=1
            fi
            debug "   - $file"
        fi
    done

    if [ $any_partial -eq 1 ]; then
        debug "   Auto-fixes will affect the entire file"
    fi
}

has_unstaged_changes() {
    # Check if a file has unstaged changes
    # Returns: 0 if file has unstaged changes, 1 if not
    local file="$1"
    git diff --quiet "$file" 2>/dev/null
    return $?
}

auto_stage_fixes() {
    # Stage auto-fixed files with partial staging awareness
    # Usage: auto_stage_fixes "$FIXED_FILES" "TypeScript"
    local files="$1"
    local file_type="$2"

    if [ -n "$files" ]; then
        success "Auto-staging fixed ${file_type} files..."
        echo "$files" | xargs git add
        FIXES_APPLIED=1
    fi
}

activate_venv() {
    # Activate Python virtual environment if available
    # Tries common venv paths: .venv, venv, .virtualenv, virtualenv
    # Falls back to system Python tools if no venv found
    
    # Skip if already in a virtual environment
    if [ -n "$VIRTUAL_ENV" ]; then
        debug "Already in virtual environment: $VIRTUAL_ENV"
        return 0
    fi

    # Try to find and activate virtual environment
    local venv_paths=(".venv" "venv" ".virtualenv" "virtualenv")
    local venv_found=0

    for venv_path in "${venv_paths[@]}"; do
        if [ -f "$PROJECT_ROOT/$venv_path/bin/activate" ]; then
            debug "Activating virtual environment: $venv_path"
            # shellcheck disable=SC1090,SC1091
            if . "$PROJECT_ROOT/$venv_path/bin/activate" 2>/dev/null; then
                venv_found=1
                break
            else
                warn "Failed to activate $venv_path"
            fi
        fi
    done

    if [ $venv_found -eq 0 ]; then
        # Check if Python tools are available in system
        if command -v ruff >/dev/null 2>&1 || command -v uv >/dev/null 2>&1; then
            debug "No virtual environment found, using system Python tools"
            return 0
        else
            warn "No virtual environment found and Python tools not in PATH"
            debug "Consider running: python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt"
            return 1
        fi
    fi

    return 0
}

check_tanaka_py_modified() {
    # Check if tanaka.py or related scripts are being modified
    # Returns: 0 if modified (warning condition), 1 if not
    if git diff --cached --name-only | grep -q "scripts/tanaka.py\|scripts/tasks/.*\.py"; then
        echo ""
        warn "Warning: Python scripts are being modified"
        debug "Some linting checks may behave unexpectedly"
        debug "Consider running checks manually after commit"
        return 0
    fi
    return 1
}

# Export variables that checkers need
export FIXES_APPLIED ERRORS_FOUND PARTIAL_STAGING_WARNING

# Export functions so they're available to sourced scripts
export -f emit debug info warn error success header
export -f log_stage_start log_stage_skip log_stage_finish
export -f check_partial_staging warn_partial_staging
export -f has_unstaged_changes auto_stage_fixes
export -f activate_venv check_tanaka_py_modified
