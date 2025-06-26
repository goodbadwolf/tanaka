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

    # Convert paths for the extension directory context
    RELATIVE_FILES=$(echo "$STAGED_TS_FILES" | sed 's|^extension/||g')

    if [ "${QUICK_MODE:-0}" -eq 1 ]; then
        debug "Quick mode: Running TypeScript compiler check only"
        if (cd "$PROJECT_ROOT/extension" && pnpm run typecheck); then
            log_stage_finish "TypeScript Linting" "PASSED"
            return 0
        else
            log_stage_finish "TypeScript Linting" "FAILED"
            ERRORS_FOUND=1
            return 1
        fi
    fi

    debug "Running formatter (pnpm run format)..."
    local FORMAT_FAILED=0
    if ! (cd "$PROJECT_ROOT/extension" && pnpm run format); then
        FORMAT_FAILED=1
    fi

    debug "Running linter (pnpm run lint:fix)..."
    local LINT_FAILED=0
    if ! (cd "$PROJECT_ROOT/extension" && pnpm run lint:fix); then
        LINT_FAILED=1
    fi

    debug "Running type checker (pnpm run typecheck)..."
    local TYPECHECK_FAILED=0
    if ! (cd "$PROJECT_ROOT/extension" && pnpm run typecheck); then
        TYPECHECK_FAILED=1
    fi

    # Check which files were actually modified and stage them
    local FIXED_FILES=""
    for file in $STAGED_TS_FILES; do
        if ! has_unstaged_changes "$file"; then
            FIXED_FILES="$FIXED_FILES $file"
        fi
    done

    if [ -n "$FIXED_FILES" ]; then
        auto_stage_fixes "$FIXED_FILES" "TypeScript"
    fi

    if [ $FORMAT_FAILED -eq 1 ] || [ $LINT_FAILED -eq 1 ] || [ $TYPECHECK_FAILED -eq 1 ]; then
        log_stage_finish "TypeScript Linting" "FAILED"
        if [ $TYPECHECK_FAILED -eq 1 ]; then
            error "TypeScript type errors must be fixed before committing"
        fi
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