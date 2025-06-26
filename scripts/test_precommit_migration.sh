#!/bin/bash
#
# Test script for pre-commit migration
# ====================================
#
# This script helps validate that the pre-commit hooks work correctly
# and match the behavior of the previous Husky setup.
#

set -e

echo "🧪 Testing pre-commit migration..."
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_hook() {
  local test_name="$1"
  local test_command="$2"
  local expected_result="$3"

  echo -n "Testing: $test_name... "

  if eval "$test_command"; then
    if [ "$expected_result" = "pass" ]; then
      echo -e "${GREEN}✓ PASSED${NC}"
      return 0
    else
      echo -e "${RED}✗ FAILED${NC} (expected to fail but passed)"
      return 1
    fi
  else
    if [ "$expected_result" = "fail" ]; then
      echo -e "${GREEN}✓ PASSED${NC} (correctly failed)"
      return 0
    else
      echo -e "${RED}✗ FAILED${NC} (expected to pass but failed)"
      return 1
    fi
  fi
}

# Check if pre-commit is installed
if ! command -v pre-commit &>/dev/null; then
  echo -e "${RED}Error: pre-commit is not installed${NC}"
  echo "Run: pip install pre-commit"
  exit 1
fi

# Check if hooks are installed
if [ ! -f .git/hooks/pre-commit ]; then
  echo -e "${YELLOW}Warning: pre-commit hooks not installed${NC}"
  echo "Run: pre-commit install"
  echo ""
fi

# Test 1: Validate configuration
echo -e "${BLUE}1. Configuration Validation${NC}"
test_hook "Config syntax" "pre-commit validate-config" "pass"
echo ""

# Test 2: Run all hooks on current files
echo -e "${BLUE}2. Dry Run (no changes)${NC}"
test_hook "All hooks" "pre-commit run --all-files --verbose" "pass"
echo ""

# Test 3: Test quick mode
echo -e "${BLUE}3. Quick Mode Test${NC}"
export PRE_COMMIT_QUICK=1
test_hook "Quick mode" "pre-commit run typescript --all-files 2>&1 | grep -q 'Skipping typescript'" "pass"
unset PRE_COMMIT_QUICK
echo ""

# Test 4: Test specific hooks
echo -e "${BLUE}4. Individual Hook Tests${NC}"
test_hook "Python ruff" "pre-commit run ruff --all-files" "pass"
test_hook "Shell check" "pre-commit run shellcheck --all-files" "pass"
test_hook "Markdown lint" "pre-commit run markdownlint-fix --all-files" "pass"
echo ""

# Test 5: Test commit message validation
echo -e "${BLUE}5. Commit Message Validation${NC}"
# Create a test commit message
echo "feat: test commit message" >.git/TEST_COMMIT_MSG
test_hook "Valid message" "pre-commit run --hook-stage commit-msg --commit-msg-filename .git/TEST_COMMIT_MSG commitizen" "pass"

echo "bad commit message" >.git/TEST_COMMIT_MSG
test_hook "Invalid message" "pre-commit run --hook-stage commit-msg --commit-msg-filename .git/TEST_COMMIT_MSG commitizen 2>/dev/null" "fail"
rm -f .git/TEST_COMMIT_MSG
echo ""

# Test 6: Performance comparison
echo -e "${BLUE}6. Performance Test${NC}"
echo "Running all hooks and timing..."
time pre-commit run --all-files >/dev/null 2>&1
echo ""

# Summary
echo -e "${GREEN}✅ Pre-commit migration tests complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Install hooks: pre-commit install"
echo "2. Test with actual commits"
echo "3. Compare with Husky timing"
echo "4. Remove Husky when satisfied"
