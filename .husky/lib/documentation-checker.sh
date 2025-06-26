#!/bin/bash
#
# Documentation Update Checker
# ============================
#
# Reminds developers to update docs when making significant changes.
#
# Dependencies:
# -------------
# - None (uses git only)
#

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_documentation() {
    # Check if documentation might need updating based on changed files
    # - Config changes → DEV.md, INSTALL.md
    # - API changes → API docs
    # - Build config changes → build instructions
    # - Major source changes → consider docs
    # - Non-blocking reminders only
    
    # Define files that might need doc updates when changed
    local CONFIG_CHANGED=$(git diff --cached --name-only | grep -E '(Cargo\.toml|package\.json|manifest\.json|example\.toml)$')
    local API_CHANGED=$(git diff --cached --name-only | grep -E 'server/src/(routes|models).*\.rs$')
    local BUILD_CHANGED=$(git diff --cached --name-only | grep -E '(rspack\.config|vite\.config|webpack\.config).*\.(js|ts)$')
    local MAJOR_SOURCE_CHANGES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|rs)$' | head -20)
    
    local NEEDS_DOC_REVIEW=0
    local SUGGESTIONS=""
    
    if [ -n "$CONFIG_CHANGED" ]; then
        NEEDS_DOC_REVIEW=1
        SUGGESTIONS="${SUGGESTIONS}  - DEV.md (new commands, dependencies)\\n"
        SUGGESTIONS="${SUGGESTIONS}  - INSTALL.md (if config format changed)\\n"
        
        # Check for version changes
        if echo "$CONFIG_CHANGED" | grep -qE '(manifest\.json|Cargo\.toml)'; then
            SUGGESTIONS="${SUGGESTIONS}  - README.md (version/feature status)\\n"
        fi
    fi
    
    if [ -n "$API_CHANGED" ]; then
        NEEDS_DOC_REVIEW=1
        SUGGESTIONS="${SUGGESTIONS}  - DEV.md (API endpoint documentation)\\n"
    fi
    
    if [ -n "$BUILD_CHANGED" ]; then
        NEEDS_DOC_REVIEW=1
        SUGGESTIONS="${SUGGESTIONS}  - DEV.md (build process updates)\\n"
    fi
    
    # Count significant source file changes
    local SOURCE_COUNT=$(echo "$MAJOR_SOURCE_CHANGES" | grep -c '^' || echo 0)
    if [ "$SOURCE_COUNT" -gt 5 ]; then
        NEEDS_DOC_REVIEW=1
        SUGGESTIONS="${SUGGESTIONS}  - README.md (feature status if applicable)\\n"
        SUGGESTIONS="${SUGGESTIONS}  - Architecture docs if design changed\\n"
    fi
    
    # Check if docs are already being updated
    local DOC_FILES=$(git diff --cached --name-only | grep -E '\.(md|MD)$' | grep -v ROADMAP)
    
    if [ "$NEEDS_DOC_REVIEW" -eq 1 ] && [ -z "$DOC_FILES" ]; then
        echo ""
        warn "Documentation reminder:"
        debug "These changes might need documentation updates:"
        echo -e "$SUGGESTIONS"
        debug "Per CLAUDE.md: Update docs before pull requests"
        echo ""
    fi
    
    return 0
}

# Export the main function
export -f check_documentation