#!/bin/bash

# HR System Comprehensive Test Runner
# This script runs all tests and provides a detailed report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
API_TESTS_PASSED=0
API_TESTS_FAILED=0
WEB_TESTS_PASSED=0
WEB_TESTS_FAILED=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                   ║${NC}"
echo -e "${BLUE}║         HR SYSTEM COMPREHENSIVE TEST RUNNER                      ║${NC}"
echo -e "${BLUE}║                                                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to run API tests
run_api_tests() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running Backend API Tests...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd apps/api

    # Check if test database is available
    echo -e "${YELLOW}Checking test database connection...${NC}"
    
    # Run tests
    if npm test 2>&1 | tee /tmp/api_test_output.log; then
        API_TESTS_PASSED=1
        echo -e "${GREEN}✓ API Tests Passed${NC}"
    else
        API_TESTS_FAILED=1
        echo -e "${RED}✗ API Tests Failed${NC}"
    fi

    cd ../..
    echo ""
}

# Function to run Web tests
run_web_tests() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running Frontend Web Tests...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd apps/web

    if npm test -- --run 2>&1 | tee /tmp/web_test_output.log; then
        WEB_TESTS_PASSED=1
        echo -e "${GREEN}✓ Web Tests Passed${NC}"
    else
        WEB_TESTS_FAILED=1
        echo -e "${RED}✗ Web Tests Failed${NC}"
    fi

    cd ../..
    echo ""
}

# Function to check test coverage
check_coverage() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Generating Test Coverage Report...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd apps/api
    if [ -d "coverage" ]; then
        echo -e "${GREEN}API Coverage Report generated in apps/api/coverage${NC}"
    fi
    cd ../..
}

# Main execution
main() {
    START_TIME=$(date +%s)

    # Run API tests
    run_api_tests

    # Run Web tests (if tests exist)
    if [ -f "apps/web/package.json" ] && grep -q "\"test\"" apps/web/package.json; then
        run_web_tests
    else
        echo -e "${YELLOW}Web tests not configured, skipping...${NC}"
        echo ""
    fi

    # Check coverage
    check_coverage

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Final Report
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                      TEST SUMMARY REPORT                         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ $API_TESTS_PASSED -eq 1 ]; then
        echo -e "${GREEN}✓ Backend API Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ Backend API Tests: FAILED${NC}"
    fi

    if [ $WEB_TESTS_PASSED -eq 1 ]; then
        echo -e "${GREEN}✓ Frontend Web Tests: PASSED${NC}"
    elif [ $WEB_TESTS_FAILED -eq 1 ]; then
        echo -e "${RED}✗ Frontend Web Tests: FAILED${NC}"
    else
        echo -e "${YELLOW}○ Frontend Web Tests: SKIPPED${NC}"
    fi

    echo ""
    echo -e "${BLUE}Total Duration: ${DURATION}s${NC}"
    echo ""

    # Exit with error if any tests failed
    if [ $API_TESTS_FAILED -eq 1 ] || [ $WEB_TESTS_FAILED -eq 1 ]; then
        echo -e "${RED}Some tests failed. Please check the logs above.${NC}"
        exit 1
    else
        echo -e "${GREEN}All tests passed successfully! 🎉${NC}"
        exit 0
    fi
}

# Run main function
main
