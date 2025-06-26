#!/bin/bash

# Rust linting checker
# Handles Rust file formatting and clippy checks

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_rust() {
    # Check if any Rust files are staged
    STAGED_RUST_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.rs$' | grep '^server/')

    if [ -z "$STAGED_RUST_FILES" ]; then
        log_stage_skip "Rust Linting" "no Rust files staged"
        return 0
    fi

    if [ ! -d "server" ]; then
        log_stage_skip "Rust Linting" "server directory not found"
        return 0
    fi

    log_stage_start "Rust Linting"

    # Show file count warning if many files
    local file_count
    file_count=$(echo "$STAGED_RUST_FILES" | wc -w | tr -d ' ')
    if [ "$file_count" -gt 20 ]; then
        warn "Linting $file_count Rust files (this may take a moment)"
    fi

    # Check for partially staged files
    warn_partial_staging "$STAGED_RUST_FILES"

    # First run cargo fmt
    debug "Running cargo fmt..."
    if (cd "$PROJECT_ROOT/server" && cargo fmt --all); then
        # Check which files were formatted
        local FIXED_FILES=""
        for file in $STAGED_RUST_FILES; do
            if ! has_unstaged_changes "$file"; then
                FIXED_FILES="$FIXED_FILES $file"
            fi
        done

        if [ -n "$FIXED_FILES" ]; then
            auto_stage_fixes "$FIXED_FILES" "Rust"
        fi

        # In quick mode, skip clippy and tests
        if [ "${QUICK_MODE:-0}" -eq 1 ]; then
            debug "Quick mode: Skipping cargo clippy and tests"
            if [ -n "$FIXED_FILES" ]; then
                log_stage_finish "Rust Linting" "FIXED"
            else
                log_stage_finish "Rust Linting" "PASSED"
            fi
            return 0
        fi

        # Run clippy to check for issues
        debug "Running cargo clippy..."
        local CLIPPY_FAILED=0
        if ! (cd "$PROJECT_ROOT/server" && cargo clippy --all-targets --all-features -- -D warnings); then
            CLIPPY_FAILED=1
        fi

        # Run tests
        debug "Running cargo test..."
        local TEST_FAILED=0
        if ! (cd "$PROJECT_ROOT/server" && cargo test); then
            TEST_FAILED=1
        fi

        if [ $CLIPPY_FAILED -eq 1 ] || [ $TEST_FAILED -eq 1 ]; then
            log_stage_finish "Rust Linting" "FAILED"
            if [ $CLIPPY_FAILED -eq 1 ]; then
                warn "Fix the clippy warnings before committing"
            fi
            if [ $TEST_FAILED -eq 1 ]; then
                error "Tests must pass before committing"
            fi
            ERRORS_FOUND=1
            return 1
        elif [ -n "$FIXED_FILES" ]; then
            log_stage_finish "Rust Linting" "FIXED"
        else
            log_stage_finish "Rust Linting" "PASSED"
        fi
        return 0
    else
        log_stage_finish "Rust Linting" "FAILED"
        ERRORS_FOUND=1
        return 1
    fi
}

# Export the main function
export -f check_rust