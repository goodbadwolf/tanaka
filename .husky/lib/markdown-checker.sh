#!/bin/bash

# Markdown linting checker
# Handles markdown file validation and auto-fixing

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_markdown() {
    # Check if any markdown files are staged
    MD_STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$' | grep -v "repomix-output.txt.md" | grep -v "MIGRATION" | grep -v "TESTING-UPGRADE.md")

    if [ -z "$MD_STAGED" ]; then
        log_stage_skip "Markdown Linting" "no markdown files staged"
        return 0
    fi

    log_stage_start "Markdown Linting"

    # Show file count warning if many files
    local file_count
    file_count=$(echo "$MD_STAGED" | wc -w | tr -d ' ')
    if [ "$file_count" -gt 20 ]; then
        warn "Linting $file_count markdown files (this may take a moment)"
    fi

    # Check for partially staged files
    warn_partial_staging "$MD_STAGED"

    # Quick mode - just check if files exist
    if [ "${QUICK_MODE:-0}" -eq 1 ]; then
        debug "Quick mode: Skipping markdown linting"
        log_stage_finish "Markdown Linting" "SKIPPED"
        return 0
    fi

    local TANAKA_PY_MODIFIED
    TANAKA_PY_MODIFIED=$(
        check_tanaka_py_modified
        echo $?
    )

    if [ "$TANAKA_PY_MODIFIED" -eq 0 ]; then
        warn "Using basic markdown check due to script modifications"
        # Fallback to basic check
        if command -v pymarkdownlnt >/dev/null 2>&1; then
            if pymarkdownlnt scan $MD_STAGED; then
                log_stage_finish "Markdown Linting" "PASSED"
                return 0
            else
                log_stage_finish "Markdown Linting" "FAILED"
                ERRORS_FOUND=1
                return 1
            fi
        else
            debug "pymarkdownlnt not found, skipping markdown check"
            log_stage_finish "Markdown Linting" "SKIPPED"
            return 0
        fi
    fi

    # Normal path using tanaka.py
    debug "Attempting to auto-fix markdown issues..."
    if python3 scripts/tanaka.py lint --markdown --fix >/dev/null 2>&1; then
        # Check which files were actually modified
        local FIXED_FILES=""
        for file in $MD_STAGED; do
            if ! has_unstaged_changes "$file"; then
                FIXED_FILES="$FIXED_FILES $file"
            fi
        done

        if [ -n "$FIXED_FILES" ]; then
            auto_stage_fixes "$FIXED_FILES" "markdown"
            log_stage_finish "Markdown Linting" "FIXED"
        else
            log_stage_finish "Markdown Linting" "PASSED"
        fi
        return 0
    else
        # If auto-fix failed, run without fix to show errors
        warn "Auto-fix failed, showing errors:"
        python3 scripts/tanaka.py lint --markdown || {
            log_stage_finish "Markdown Linting" "FAILED"
            ERRORS_FOUND=1
            return 1
        }
    fi
}

# Export the main function
export -f check_markdown