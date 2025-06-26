#!/bin/bash

# TypeScript linting checker
# Handles TypeScript/JavaScript file validation and formatting

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_typescript() {
    # Check if any TypeScript files are staged
    STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' | grep '^extension/')

    if [ -z "$STAGED_TS_FILES" ]; then
        log_stage_skip "TypeScript Linting" "no TypeScript files staged"
        return 0
    fi

    if [ ! -d "extension" ]; then
        log_stage_skip "TypeScript Linting" "extension directory not found"
        return 0
    fi

    log_stage_start "TypeScript Linting"

    # Show file count warning if many files
    local file_count
    file_count=$(echo "$STAGED_TS_FILES" | wc -w | tr -d ' ')
    if [ "$file_count" -gt 20 ]; then
        warn "Linting $file_count TypeScript files (this may take a moment)"
    fi

    # Check for partially staged files
    warn_partial_staging "$STAGED_TS_FILES"

    cd extension || return 1

    # Convert paths for the extension directory context
    RELATIVE_FILES=$(echo "$STAGED_TS_FILES" | sed 's|^extension/||g')

    if [ "${QUICK_MODE:-0}" -eq 1 ]; then
        debug "Quick mode: Running TypeScript compiler check only"
        if pnpm exec tsc --noEmit; then
            cd ..
            log_stage_finish "TypeScript Linting" "PASSED"
            return 0
        else
            cd ..
            log_stage_finish "TypeScript Linting" "FAILED"
            ERRORS_FOUND=1
            return 1
        fi
    fi

    debug "Running Prettier..."
    local PRETTIER_FAILED=0
    echo "$RELATIVE_FILES" | xargs pnpm exec prettier --write || PRETTIER_FAILED=1

    debug "Running ESLint..."
    local ESLINT_FAILED=0
    echo "$RELATIVE_FILES" | xargs pnpm exec eslint --fix || ESLINT_FAILED=1

    # Check which files were actually modified and stage them
    cd .. || return 1
    local FIXED_FILES=""
    for file in $STAGED_TS_FILES; do
        if ! has_unstaged_changes "$file"; then
            FIXED_FILES="$FIXED_FILES $file"
        fi
    done

    if [ -n "$FIXED_FILES" ]; then
        auto_stage_fixes "$FIXED_FILES" "TypeScript"
    fi

    if [ $PRETTIER_FAILED -eq 1 ] || [ $ESLINT_FAILED -eq 1 ]; then
        log_stage_finish "TypeScript Linting" "FAILED"
        ERRORS_FOUND=1
        return 1
    elif [ -n "$FIXED_FILES" ]; then
        log_stage_finish "TypeScript Linting" "FIXED"
    else
        log_stage_finish "TypeScript Linting" "PASSED"
    fi

    return 0
}

# Export the main function
export -f check_typescript