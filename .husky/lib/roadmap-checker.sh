#!/bin/bash

# Roadmap tracking checker
# Reminds developers to update ROADMAP*.md files when working on tracked features

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

check_roadmap() {
    # Check if any source files are being modified
    local SOURCE_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|rs|py)$')
    
    if [ -z "$SOURCE_FILES" ]; then
        return 0
    fi
    
    # Check if any ROADMAP files are already being updated
    local ROADMAP_FILES=$(git diff --cached --name-only | grep -E 'ROADMAP.*\.md$')
    
    if [ -n "$ROADMAP_FILES" ]; then
        # ROADMAP files are being updated, good!
        return 0
    fi
    
    # Check commit message for roadmap-related keywords
    local COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
    local ROADMAP_KEYWORDS="roadmap|milestone|v0\.5|v1\.0|feat:|fix:|refactor:"
    
    # Only show reminder if working on significant changes
    local FILE_COUNT=$(echo "$SOURCE_FILES" | wc -l | tr -d ' ')
    if [ "$FILE_COUNT" -gt 2 ]; then
        echo ""
        warn "Reminder: Working on roadmap items?"
        debug "Consider updating these files if applicable:"
        echo "  - docs/ROADMAP-v0.5-v1.0.md (mark items complete, update metrics)"
        echo "  - docs/ROADMAP-v0.5-v1.0-STEPS.md (check off commits, add notes)"
        echo ""
        debug "Per CLAUDE.md: Include doc updates in the same commit"
        echo ""
    fi
    
    return 0
}

# Export the main function
export -f check_roadmap