#!/bin/bash

# ============================================
# SmartFactory CONNECT - Database Import Script
# ============================================
# Purpose: Drop existing database and import fresh backup
# Usage: ./scripts/import-database.sh
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
CONTAINER_NAME="smartfactory_database"
DB_USER="smartfactory"
DB_PASSWORD="smartfactory123"
DB_NAME="smartfactory_db"
BACKUP_FILE="./data/smartfactory_db_backup.sql"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}SmartFactory CONNECT - Database Import${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Docker container is running
echo -e "${YELLOW}[1/6] Checking Docker container...${NC}"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: Container '$CONTAINER_NAME' is not running.${NC}"
    echo -e "${YELLOW}Please start the containers first:${NC}"
    echo "  docker-compose up -d database"
    exit 1
fi
echo -e "${GREEN}✓ Container is running${NC}"
echo ""

# Check if backup file exists
echo -e "${YELLOW}[2/6] Checking backup file...${NC}"
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backup file found: $BACKUP_FILE${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}[3/6] Waiting for PostgreSQL to be ready...${NC}"
until docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d postgres > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
echo ""

# Terminate existing connections and drop database
echo -e "${YELLOW}[4/6] Dropping existing database...${NC}"
echo -e "${RED}⚠️  WARNING: This will delete all existing data in '$DB_NAME'${NC}"
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Import cancelled.${NC}"
    exit 0
fi

echo "  Terminating active connections..."
docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

echo "  Dropping database..."
docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d postgres -c \
    "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1

echo "  Creating fresh database..."
docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d postgres -c \
    "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';" > /dev/null 2>&1

echo -e "${GREEN}✓ Database recreated successfully${NC}"
echo ""

# Import backup file
echo -e "${YELLOW}[5/6] Importing database from backup...${NC}"
echo "  This may take a few minutes..."
docker exec -i -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database imported successfully${NC}"
else
    echo -e "${RED}✗ Error importing database${NC}"
    exit 1
fi
echo ""

# Verify import
echo -e "${YELLOW}[6/6] Verifying import...${NC}"
TABLE_COUNT=$(docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

echo "  Total tables imported: $TABLE_COUNT"

# Show table list
echo -e "\n${BLUE}Imported tables:${NC}"
docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | head -n -2 | tail -n +3

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Database import completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Database Information:${NC}"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Restart backend container: docker-compose restart backend"
echo "  2. Check backend logs: docker-compose logs -f backend"
echo ""
