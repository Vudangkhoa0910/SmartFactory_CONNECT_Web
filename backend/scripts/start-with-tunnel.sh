#!/bin/bash

# ============================================================
# SmartFactory CONNECT - Backend with Cloudflare Tunnel
# ============================================================
# This script starts the backend server and creates a public
# tunnel using Cloudflare's quick tunnel feature.
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${PORT:-3000}
TUNNEL_LOG="/tmp/cloudflared-tunnel.log"
TUNNEL_URL_FILE="/tmp/cloudflared-url.txt"

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         SmartFactory CONNECT - Backend + Tunnel               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    
    # Kill cloudflared tunnel
    if [ ! -z "$TUNNEL_PID" ]; then
        echo -e "${YELLOW}   Stopping Cloudflare Tunnel (PID: $TUNNEL_PID)...${NC}"
        kill $TUNNEL_PID 2>/dev/null || true
    fi
    
    # Kill any remaining cloudflared processes for this tunnel
    pkill -f "cloudflared.*tunnel.*--url.*localhost:$BACKEND_PORT" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed!${NC}"
    echo -e "${YELLOW}   Install with: brew install cloudflared${NC}"
    exit 1
fi

# Check if port is already in use
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
    echo -e "${YELLOW}   Backend might already be running${NC}"
    BACKEND_ALREADY_RUNNING=true
else
    BACKEND_ALREADY_RUNNING=false
fi

# Start Cloudflare Tunnel in background
echo -e "${BLUE}🌐 Starting Cloudflare Tunnel...${NC}"
cloudflared tunnel --url http://localhost:$BACKEND_PORT > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo -e "${GREEN}   Tunnel process started (PID: $TUNNEL_PID)${NC}"

# Wait for tunnel URL to be available
echo -e "${YELLOW}   Waiting for tunnel URL...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
TUNNEL_URL=""

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 1
    ATTEMPTS=$((ATTEMPTS + 1))
    
    # Try to extract URL from log
    TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    
    if [ ! -z "$TUNNEL_URL" ]; then
        break
    fi
    
    echo -ne "\r${YELLOW}   Waiting for tunnel URL... ($ATTEMPTS/$MAX_ATTEMPTS)${NC}"
done

echo ""

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}❌ Failed to get tunnel URL after $MAX_ATTEMPTS seconds${NC}"
    echo -e "${YELLOW}   Check log at: $TUNNEL_LOG${NC}"
    cat "$TUNNEL_LOG"
    exit 1
fi

# Save URL to file for other scripts to use
echo "$TUNNEL_URL" > "$TUNNEL_URL_FILE"

# Display tunnel information
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              🚀 CLOUDFLARE TUNNEL ACTIVE                      ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo -e "║  ${CYAN}Public URL:${GREEN} $TUNNEL_URL"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  API Endpoints:                                               ║"
echo -e "║    ${CYAN}Health:${GREEN}  $TUNNEL_URL/health"
echo -e "║    ${CYAN}API:${GREEN}     $TUNNEL_URL/api"
echo -e "║    ${CYAN}Swagger:${GREEN} $TUNNEL_URL/api-docs"
echo -e "║    ${CYAN}Metrics:${GREEN} $TUNNEL_URL/metrics"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Frontend Configuration:                                      ║"
echo -e "║    ${CYAN}VITE_API_BASE_URL=${GREEN}$TUNNEL_URL/api"
echo -e "║    ${CYAN}VITE_WS_URL=${GREEN}$(echo $TUNNEL_URL | sed 's/https/wss/')"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Mobile App Configuration:                                    ║"
echo -e "║    ${CYAN}baseUrl:${GREEN} $TUNNEL_URL/api"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo -e "║  ${YELLOW}⚠️  This URL changes each time you restart the tunnel${NC}${GREEN}       ║"
echo -e "║  ${YELLOW}📋 URL saved to: $TUNNEL_URL_FILE${NC}${GREEN}"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Copy URL to clipboard if pbcopy is available (macOS)
if command -v pbcopy &> /dev/null; then
    echo "$TUNNEL_URL" | pbcopy
    echo -e "${GREEN}📋 URL copied to clipboard!${NC}"
fi

# If backend is not running, start it
if [ "$BACKEND_ALREADY_RUNNING" = false ]; then
    echo -e "\n${BLUE}🚀 Starting Backend Server...${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop both tunnel and server${NC}\n"
    
    # Start backend (this will block)
    cd "$(dirname "$0")/.."
    npm start
else
    echo -e "\n${GREEN}✅ Backend is already running on port $BACKEND_PORT${NC}"
    echo -e "${YELLOW}   Tunnel is forwarding traffic to existing backend${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop the tunnel${NC}\n"
    
    # Keep script running to maintain tunnel
    wait $TUNNEL_PID
fi
