#!/bin/bash

# Script tự động restore database từ file SQL
# Usage: ./restore_database.sh <path_to_sql_file>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="smartfactory_db"
DB_HOST="localhost"
DB_USER="${USER}"
BACKUP_DIR="src/database/backups"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Smart Factory Database Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if SQL file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: SQL file path is required${NC}"
    echo "Usage: $0 <path_to_sql_file>"
    exit 1
fi

SQL_FILE="$1"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file '$SQL_FILE' not found${NC}"
    exit 1
fi

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Step 1: Backup current database
echo -e "\n${YELLOW}Step 1: Creating backup of current database...${NC}"
BACKUP_FILE="${BACKUP_DIR}/backup_before_restore_$(date +%Y%m%d_%H%M%S).backup"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

# Step 2: Drop and recreate database
echo -e "\n${YELLOW}Step 2: Dropping and recreating database...${NC}"
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;"
echo -e "${GREEN}✓ Database recreated${NC}"

# Step 3: Restore from SQL file
echo -e "\n${YELLOW}Step 3: Restoring database from SQL file...${NC}"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" 2>&1 | grep -v "ERROR: role" || true
echo -e "${GREEN}✓ Database restored${NC}"

# Step 4: Fix ownership
echo -e "\n${YELLOW}Step 4: Fixing ownership and permissions...${NC}"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;"
echo -e "${GREEN}✓ Ownership fixed${NC}"

# Step 5: Verify restoration
echo -e "\n${YELLOW}Step 5: Verifying database restoration...${NC}"
echo -e "\nTables:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo -e "\nData counts:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'departments' as table_name, COUNT(*) as row_count FROM departments 
UNION ALL SELECT 'users', COUNT(*) FROM users 
UNION ALL SELECT 'incidents', COUNT(*) FROM incidents 
UNION ALL SELECT 'ideas', COUNT(*) FROM ideas 
UNION ALL SELECT 'news', COUNT(*) FROM news 
ORDER BY table_name;"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nBackup location: ${YELLOW}$BACKUP_FILE${NC}"
echo -e "In case of issues, you can restore from backup using:"
echo -e "${YELLOW}pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c -v $BACKUP_FILE${NC}"
