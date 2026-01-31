#!/bin/bash
# =============================================================================
# SmartFactory CONNECT - Export Docker Images for Deployment
# =============================================================================
# Script này export tất cả Docker images cần thiết để deploy sang máy khác
# Output: Thư mục docker-images/ chứa các file .tar
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/docker-images"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SmartFactory CONNECT - Docker Images Export Tool             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# List of images to export
IMAGES=(
    "smartfactory_connect_web-frontend:latest"
    "smartfactory_connect_web-backend:latest"
    "smartfactory_connect_web-rag_service:latest"
    "pgvector/pgvector:pg15"
    "mongo:7.0"
    "cloudflare/cloudflared:latest"
)

# Image file names
IMAGE_FILES=(
    "frontend.tar"
    "backend.tar"
    "rag_service.tar"
    "pgvector-pg15.tar"
    "mongo-7.0.tar"
    "cloudflared.tar"
)

echo -e "${YELLOW}📦 Starting export process...${NC}"
echo -e "${YELLOW}   Output directory: $OUTPUT_DIR${NC}"
echo ""

# Export each image
for i in "${!IMAGES[@]}"; do
    IMAGE="${IMAGES[$i]}"
    FILE="${IMAGE_FILES[$i]}"
    OUTPUT_PATH="$OUTPUT_DIR/$FILE"
    
    echo -e "${BLUE}[$((i+1))/${#IMAGES[@]}] Exporting: $IMAGE${NC}"
    
    # Check if image exists
    if docker image inspect "$IMAGE" &> /dev/null; then
        # Export with progress
        docker save "$IMAGE" -o "$OUTPUT_PATH"
        SIZE=$(ls -lh "$OUTPUT_PATH" | awk '{print $5}')
        echo -e "    ${GREEN}✓ Saved: $FILE ($SIZE)${NC}"
    else
        echo -e "    ${RED}✗ Image not found: $IMAGE${NC}"
        echo -e "    ${YELLOW}  Trying to pull...${NC}"
        docker pull "$IMAGE" || true
        if docker image inspect "$IMAGE" &> /dev/null; then
            docker save "$IMAGE" -o "$OUTPUT_PATH"
            SIZE=$(ls -lh "$OUTPUT_PATH" | awk '{print $5}')
            echo -e "    ${GREEN}✓ Saved: $FILE ($SIZE)${NC}"
        else
            echo -e "    ${RED}✗ Failed to export: $IMAGE${NC}"
        fi
    fi
done

echo ""
echo -e "${YELLOW}📋 Copying configuration files...${NC}"

# Create deployment package directory
DEPLOY_DIR="$OUTPUT_DIR/deployment-package"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
cp "$PROJECT_DIR/docker-compose.yml" "$DEPLOY_DIR/"
cp "$PROJECT_DIR/.env" "$DEPLOY_DIR/" 2>/dev/null || echo "  Note: .env not found, will need to create"

# Copy backend config
mkdir -p "$DEPLOY_DIR/backend"
cp "$PROJECT_DIR/backend/.env.local" "$DEPLOY_DIR/backend/.env" 2>/dev/null || true
cp "$PROJECT_DIR/backend/src/database/schema.sql" "$DEPLOY_DIR/backend/" 2>/dev/null || true

# Copy scripts
mkdir -p "$DEPLOY_DIR/scripts"
cp "$SCRIPT_DIR/import-docker-images.bat" "$DEPLOY_DIR/scripts/" 2>/dev/null || true
cp "$SCRIPT_DIR/import-docker-images.ps1" "$DEPLOY_DIR/scripts/" 2>/dev/null || true

echo -e "    ${GREEN}✓ Configuration files copied${NC}"

echo ""
echo -e "${YELLOW}📊 Export Summary:${NC}"
echo "─────────────────────────────────────────────────────────────"
ls -lh "$OUTPUT_DIR"/*.tar 2>/dev/null | awk '{print "  " $9 ": " $5}'
echo "─────────────────────────────────────────────────────────────"

TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | awk '{print $1}')
echo -e "${GREEN}📁 Total export size: $TOTAL_SIZE${NC}"
echo -e "${GREEN}📂 Output location: $OUTPUT_DIR${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Export Complete!                                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Copy entire 'docker-images' folder to target Windows machine"
echo "2. On Windows, run: scripts\\import-docker-images.bat"
echo "3. Or run PowerShell: scripts\\import-docker-images.ps1"
echo "4. Then: docker-compose up -d"
echo ""
