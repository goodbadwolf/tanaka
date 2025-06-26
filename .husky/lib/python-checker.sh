#!/bin/bash

# Python linting checker
# Handles Python file validation and formatting

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_python() {
    # Check if Python files are staged
    STAGED_PY_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')

    if [ -z "$STAGED_PY_FILES" ]; then
        log_stage_skip "Python Linting" "no Python files staged"
        return 0
    fi

    log_stage_start "Python Linting"

    # Show file count warning if many files
    local file_count
    file_count=$(echo "$STAGED_PY_FILES" | wc -w | tr -d ' ')
    if [ "$file_count" -gt 20 ]; then
        warn "Linting $file_count Python files (this may take a moment)"
    fi

    # Check for partially staged files
    warn_partial_staging "$STAGED_PY_FILES"

    local TANAKA_PY_MODIFIED
    TANAKA_PY_MODIFIED=$(
        check_tanaka_py_modified
        echo $?
    )

    if [ "$TANAKA_PY_MODIFIED" -eq 0 ] || [ "${QUICK_MODE:-0}" -eq 1 ]; then
        if [ "$TANAKA_PY_MODIFIED" -eq 0 ]; then
            warn "Running basic Python checks due to script modifications"
        else
            debug "Quick mode: Running syntax check only"
        fi

        # Just check syntax
        local SYNTAX_ERROR=0
        for file in $STAGED_PY_FILES; do
            if ! python3 -m py_compile "$file" 2>/dev/null; then
                error "Syntax error in $file"
                SYNTAX_ERROR=1
            fi
        done

        if [ $SYNTAX_ERROR -eq 1 ]; then
            log_stage_finish "Python Linting" "FAILED"
            ERRORS_FOUND=1
            return 1
        else
            log_stage_finish "Python Linting" "PASSED"
            return 0
        fi
    fi

    # Normal path
    debug "Running Python formatters..."

    # Run ruff with fix
    local RUFF_FAILED=0
    echo "$STAGED_PY_FILES" | xargs uv run ruff check --fix || RUFF_FAILED=1

    # Run black
    local BLACK_FAILED=0
    echo "$STAGED_PY_FILES" | xargs uv run black || BLACK_FAILED=1

    # Check which files were modified and stage them
    local FIXED_FILES=""
    for file in $STAGED_PY_FILES; do
        if ! has_unstaged_changes "$file"; then
            FIXED_FILES="$FIXED_FILES $file"
        fi
    done

    if [ -n "$FIXED_FILES" ]; then
        auto_stage_fixes "$FIXED_FILES" "Python"
    fi

    if [ $RUFF_FAILED -eq 1 ] || [ $BLACK_FAILED -eq 1 ]; then
        log_stage_finish "Python Linting" "FAILED"
        ERRORS_FOUND=1
        return 1
    elif [ -n "$FIXED_FILES" ]; then
        log_stage_finish "Python Linting" "FIXED"
    else
        log_stage_finish "Python Linting" "PASSED"
    fi

    return 0
}

# Export the main function
export -f check_python