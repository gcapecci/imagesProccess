#!/bin/bash

# Docker Build Verification Script
# This script verifies that all necessary files are present for Docker build

echo "🔍 Verifying Docker Build Requirements..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: package.json not found${NC}"
    echo "  Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✓${NC} In correct directory"

# Check required files
required_files=(
    "package.json"
    "package-lock.json"
    "Dockerfile"
    "docker-compose.yml"
    "tsconfig.json"
    "src/index.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        errors=$((errors + 1))
    fi
done

# Check directory structure
required_dirs=(
    "src"
    "src/domain"
    "src/application"
    "src/infrastructure"
    "src/presentation"
    "public"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Found: $dir/"
    else
        echo -e "${RED}✗${NC} Missing: $dir/"
        errors=$((errors + 1))
    fi
done

# Check Docker installation
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed ($(docker --version))"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    errors=$((errors + 1))
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed ($(docker compose version))"
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    errors=$((errors + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can now build and run the application:"
    echo ""
    echo "  Production:    docker compose up -d"
    echo "  Development:   docker compose -f docker-compose.dev.yml up"
    echo ""
else
    echo -e "${RED}✗ Found $errors error(s)${NC}"
    echo ""
    echo "Please fix the errors above before building."
    exit 1
fi
