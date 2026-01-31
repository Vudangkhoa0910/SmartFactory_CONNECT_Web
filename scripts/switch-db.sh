#!/bin/bash

# ============================================
# SmartFactory CONNECT - Database Environment Switcher
# ============================================
# Usage: ./switch-db.sh [local|remote]
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SmartFactory CONNECT - DB Switcher${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env files exist
check_env_files() {
  if [ ! -f "$BACKEND_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local from current .env...${NC}"
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.local" 2>/dev/null || true
  fi
  
  if [ ! -f "$BACKEND_DIR/.env.remote-db" ]; then
    echo -e "${RED}❌ .env.remote-db not found!${NC}"
    echo ""
    echo "Please create $BACKEND_DIR/.env.remote-db with:"
    echo ""
    echo "  # PostgreSQL - Remote Server"
    echo "  DB_HOST=10.0.0.1              # WireGuard IP or public IP"
    echo "  DB_PORT=5432"
    echo "  DB_NAME=smartfactory_db"
    echo "  DB_USER=smartfactory"
    echo "  DB_PASSWORD=smartfactory123"
    echo ""
    echo "  # MongoDB - Remote Server"
    echo "  MONGODB_URI=mongodb://smartfactory:smartfactory123@10.0.0.1:27017/smartfactory_media?authSource=admin"
    echo "  MONGODB_DB_NAME=smartfactory_media"
    echo ""
    exit 1
  fi
}

# Test database connection
test_connection() {
  local db_type=$1
  local host=$2
  local port=$3
  
  echo -e "${BLUE}🔍 Testing $db_type connection to $host:$port...${NC}"
  
  if command -v nc &> /dev/null; then
    if nc -z -w 3 "$host" "$port" 2>/dev/null; then
      echo -e "${GREEN}✅ $db_type connection OK${NC}"
      return 0
    else
      echo -e "${RED}❌ $db_type connection FAILED${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  'nc' not found, skipping connection test${NC}"
    return 0
  fi
}

# Switch to local database
switch_local() {
  echo -e "${YELLOW}🔄 Switching to LOCAL database...${NC}"
  
  cp "$BACKEND_DIR/.env.local" "$BACKEND_DIR/.env"
  
  echo -e "${GREEN}✅ Now using LOCAL database (Docker containers)${NC}"
  echo ""
  echo "Database configuration:"
  echo "  PostgreSQL: localhost:5432"
  echo "  MongoDB:    localhost:27017"
}

# Switch to remote database
switch_remote() {
  echo -e "${YELLOW}🔄 Switching to REMOTE database...${NC}"
  
  # Extract host from .env.remote-db
  local pg_host=$(grep "^DB_HOST=" "$BACKEND_DIR/.env.remote-db" | cut -d'=' -f2)
  local pg_port=$(grep "^DB_PORT=" "$BACKEND_DIR/.env.remote-db" | cut -d'=' -f2 || echo "5432")
  
  # Test connections
  if ! test_connection "PostgreSQL" "$pg_host" "$pg_port"; then
    echo -e "${RED}❌ Cannot connect to remote PostgreSQL!${NC}"
    echo ""
    echo "Please check:"
    echo "  1. WireGuard VPN is connected: sudo wg show"
    echo "  2. Database server is running"
    echo "  3. Firewall allows connection"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
  
  cp "$BACKEND_DIR/.env.remote-db" "$BACKEND_DIR/.env"
  
  echo -e "${GREEN}✅ Now using REMOTE database (Database Server PC)${NC}"
  echo ""
  echo "Database configuration:"
  echo "  PostgreSQL: $pg_host:$pg_port"
}

# Show current status
show_status() {
  echo -e "${BLUE}📊 Current Database Configuration:${NC}"
  echo ""
  
  if [ -f "$BACKEND_DIR/.env" ]; then
    local db_host=$(grep "^DB_HOST=" "$BACKEND_DIR/.env" | cut -d'=' -f2)
    local db_port=$(grep "^DB_PORT=" "$BACKEND_DIR/.env" | cut -d'=' -f2 || echo "5432")
    local mongo_uri=$(grep "^MONGODB_URI=" "$BACKEND_DIR/.env" | cut -d'=' -f2-)
    
    echo "  PostgreSQL: $db_host:$db_port"
    echo "  MongoDB:    $mongo_uri"
    echo ""
    
    if [[ "$db_host" == "localhost" || "$db_host" == "database" || "$db_host" == "127.0.0.1" ]]; then
      echo -e "  Mode: ${GREEN}LOCAL${NC}"
    else
      echo -e "  Mode: ${YELLOW}REMOTE${NC}"
    fi
  else
    echo -e "${RED}  No .env file found!${NC}"
  fi
}

# Restart backend
restart_backend() {
  if docker ps | grep -q smartfactory_backend; then
    echo -e "${YELLOW}🔄 Restarting backend container...${NC}"
    cd "$PROJECT_DIR"
    docker-compose restart backend
    echo -e "${GREEN}✅ Backend restarted${NC}"
  else
    echo -e "${YELLOW}ℹ️  Backend container not running, skip restart${NC}"
  fi
}

# Main
case "${1:-}" in
  "local")
    check_env_files
    switch_local
    restart_backend
    ;;
  "remote")
    check_env_files
    switch_remote
    restart_backend
    ;;
  "status")
    show_status
    ;;
  *)
    echo "Usage: $0 {local|remote|status}"
    echo ""
    echo "Options:"
    echo "  local   - Use local Docker database containers"
    echo "  remote  - Use remote Database Server PC"
    echo "  status  - Show current database configuration"
    echo ""
    show_status
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
