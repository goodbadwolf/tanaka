#!/bin/bash

# Shell script linting function for pre-commit hook
# Supports both shellcheck (linting) and shfmt (formatting)

lint_shell() {
    # Check if any shell scripts are staged
    STAGED_SH_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(sh|bash)$|^[^.]+$' | while read -r file; do
        # Check if file is a shell script by shebang
        if [ -f "$file" ] && head -n1 "$file" | grep -qE '^#!/(usr/)?bin/(ba)?sh'; then
            echo "$file"
        fi
    done)

    if [ -z "$STAGED_SH_FILES" ]; then
        log_stage_skip "Shell Script Linting" "no shell scripts staged"
        return 0
    fi

    log_stage_start "Shell Script Linting"

    # Check for partially staged files
    warn_partial_staging "$STAGED_SH_FILES"

    # Check if shellcheck is available
    if ! command -v shellcheck >/dev/null 2>&1; then
        echo "${C_YELLOW}⚠️  shellcheck not found. Install with:${C_NC}"
        echo "${C_GRAY}   brew install shellcheck  # macOS${C_NC}"
        echo "${C_GRAY}   apt install shellcheck   # Ubuntu/Debian${C_NC}"
        log_stage_finish "Shell Script Linting" "SKIPPED"
        return 0
    fi

    # Quick mode - syntax check only
    if [ $QUICK_MODE -eq 1 ]; then
        echo "${C_GRAY}Quick mode: Running syntax check only${C_NC}"
        SYNTAX_ERROR=0
        for file in $STAGED_SH_FILES; do
            if ! bash -n "$file" 2>/dev/null; then
                echo "${C_RED}Syntax error in $file${C_NC}"
                SYNTAX_ERROR=1
            fi
        done
        
        if [ $SYNTAX_ERROR -eq 1 ]; then
            log_stage_finish "Shell Script Linting" "FAILED"
            ERRORS_FOUND=1
            return 1
        else
            log_stage_finish "Shell Script Linting" "PASSED"
            return 0
        fi
    fi

    # Run shellcheck
    echo "${C_GRAY}Running shellcheck...${C_NC}"
    SHELLCHECK_FAILED=0
    
    # Common shellcheck excludes for git hooks
    # SC1091: Not following sourced files
    # SC2164: Use 'cd ... || exit' (ok in scripts with set -e)
    SHELLCHECK_OPTS="-e SC1091"
    
    for file in $STAGED_SH_FILES; do
        if ! shellcheck $SHELLCHECK_OPTS "$file"; then
            SHELLCHECK_FAILED=1
        fi
    done

    # Check if shfmt is available for auto-formatting
    if command -v shfmt >/dev/null 2>&1; then
        echo "${C_GRAY}Running shfmt formatter...${C_NC}"
        
        # shfmt options:
        # -i 4: indent with 4 spaces
        # -ci: indent case statements
        # -sr: redirect operators on same line
        # -bn: binary operators at start of line
        SHFMT_OPTS="-i 4 -ci -sr -bn"
        
        FIXED_FILES=""
        for file in $STAGED_SH_FILES; do
            # Check if file would be modified
            if ! shfmt $SHFMT_OPTS -d "$file" >/dev/null 2>&1; then
                # Format the file
                shfmt $SHFMT_OPTS -w "$file"
                
                # Check if it was actually modified
                if ! has_unstaged_changes "$file"; then
                    FIXED_FILES="$FIXED_FILES $file"
                fi
            fi
        done
        
        if [ -n "$FIXED_FILES" ]; then
            auto_stage_fixes "$FIXED_FILES" "shell script"
        fi
    else
        echo "${C_GRAY}shfmt not found (optional). Install with:${C_NC}"
        echo "${C_GRAY}   brew install shfmt  # macOS${C_NC}"
        echo "${C_GRAY}   go install mvdan.cc/sh/v3/cmd/shfmt@latest  # via Go${C_NC}"
    fi

    if [ $SHELLCHECK_FAILED -eq 1 ]; then
        log_stage_finish "Shell Script Linting" "FAILED"
        echo "${C_YELLOW}Fix the shellcheck warnings before committing${C_NC}"
        echo "${C_GRAY}Tip: Use # shellcheck disable=SC#### comments to suppress specific warnings${C_NC}"
        ERRORS_FOUND=1
        return 1
    elif [ -n "$FIXED_FILES" ]; then
        log_stage_finish "Shell Script Linting" "FIXED"
    else
        log_stage_finish "Shell Script Linting" "PASSED"
    fi

    return 0
}

# Advanced shell script validation
validate_shell_best_practices() {
    local file="$1"
    local warnings=0
    
    # Check for set -e (exit on error)
    if ! grep -q "^set -e" "$file"; then
        echo "${C_YELLOW}   ⚠️  Consider adding 'set -e' for error handling${C_NC}"
        ((warnings++))
    fi
    
    # Check for set -u (error on undefined variables)
    if ! grep -q "^set -u" "$file"; then
        echo "${C_YELLOW}   ⚠️  Consider adding 'set -u' to catch undefined variables${C_NC}"
        ((warnings++))
    fi
    
    # Check for unquoted variables (common source of bugs)
    if grep -E '\$[A-Za-z_][A-Za-z0-9_]*[^"]' "$file" | grep -v '^\s*#'; then
        echo "${C_YELLOW}   ⚠️  Found potentially unquoted variables${C_NC}"
        ((warnings++))
    fi
    
    return $warnings
}