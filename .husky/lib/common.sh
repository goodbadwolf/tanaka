#!/bin/bash

# Common functions for all checker scripts
# This file provides shared utilities used by all linting checkers

# Track global state
FIXES_APPLIED=0
ERRORS_FOUND=0
PARTIAL_STAGING_WARNING=0

# Emit function for color output that respects terminal capabilities
emit() {
    local color="$1"
    local message="$2"
    
    # Check if stdout is a terminal
    if [ -t 1 ]; then
        # Terminal - use color
        case "$color" in
            red)     echo -e "\033[0;31m${message}\033[0m" ;;
            green)   echo -e "\033[0;32m${message}\033[0m" ;;
            yellow)  echo -e "\033[1;33m${message}\033[0m" ;;
            blue)    echo -e "\033[0;34m${message}\033[0m" ;;
            gray)    echo -e "\033[0;90m${message}\033[0m" ;;
            bold)    echo -e "\033[1m${message}\033[0m" ;;
            *)       echo "$message" ;;  # No color for unknown
        esac
    else
        # Not a terminal (pipe, file, etc) - no color
        echo "$message"
    fi
}

# Logging functions
debug() { emit "gray" "$1"; }
info() { emit "blue" "$1"; }
warn() { emit "yellow" "$1"; }
error() { emit "red" "$1"; }
success() { emit "green" "$1"; }
header() { emit "bold" "$1"; }

# Function to log stage start
log_stage_start() {
    local stage_name="$1"
    echo ""
    header "Stage ${stage_name}: Started"
    debug "────────────────────────────────────────"
}

# Function to log stage skip
log_stage_skip() {
    local stage_name="$1"
    local reason="$2"
    echo ""
    header "Stage ${stage_name}: Skipped"
    debug "(${reason})"
}

# Function to log stage finish
log_stage_finish() {
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

# Check if file is partially staged
check_partial_staging() {
    local file="$1"
    # Check if file has both staged and unstaged changes
    if git diff --cached --name-only | grep -q "^$file$" &&
        git diff --name-only | grep -q "^$file$"; then
        return 0 # Partially staged
    fi
    return 1 # Fully staged or not staged
}

# Warn about partially staged files
warn_partial_staging() {
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

# Check if a file has unstaged changes
has_unstaged_changes() {
    local file="$1"
    git diff --quiet "$file" 2>/dev/null
    return $?
}

# Function to auto-stage fixed files
auto_stage_fixes() {
    local files="$1"
    local file_type="$2"

    if [ -n "$files" ]; then
        success "Auto-staging fixed ${file_type} files..."
        echo "$files" | xargs git add
        FIXES_APPLIED=1
    fi
}

# Activate Python virtual environment if needed
activate_venv() {
    if [ -z "$VIRTUAL_ENV" ]; then
        if [ -f .venv/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv/bin/activate || {
                error "Failed to activate virtual environment"
                return 1
            }
        fi
    fi
}

# Check if tanaka.py itself is being modified
check_tanaka_py_modified() {
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