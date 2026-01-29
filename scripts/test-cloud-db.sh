#!/bin/bash
# SmartFactory Cloud Database - Quick Connection Test
# Usage: ./test-cloud-db.sh

echo "🔍 SmartFactory Cloud Database Test"
echo "===================================="
echo ""

# Current ports (update if changed)
PG_HOST="bore.pub"
PG_PORT="37961"
MONGO_HOST="bore.pub"
MONGO_PORT="10714"
DB_USER="smartfactory"
DB_PASS="smartfactory123"
DB_NAME="smartfactory_db"

# Test PostgreSQL
echo "1️⃣  Testing PostgreSQL ($PG_HOST:$PG_PORT)..."
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASS psql -h $PG_HOST -p $PG_PORT -U $DB_USER -d $DB_NAME -c "SELECT 'PostgreSQL OK' as status;" 2>&1 | grep -q "PostgreSQL OK"
    if [ $? -eq 0 ]; then
        echo "   ✅ PostgreSQL: Connected!"
    else
        echo "   ❌ PostgreSQL: Connection failed"
    fi
else
    # Fallback to nc
    nc -zv $PG_HOST $PG_PORT 2>&1 | grep -q "succeeded"
    if [ $? -eq 0 ]; then
        echo "   ✅ PostgreSQL: Port accessible (psql not installed for full test)"
    else
        echo "   ❌ PostgreSQL: Port not accessible"
    fi
fi

# Test MongoDB
echo ""
echo "2️⃣  Testing MongoDB ($MONGO_HOST:$MONGO_PORT)..."
nc -zv $MONGO_HOST $MONGO_PORT 2>&1 | grep -q "succeeded"
if [ $? -eq 0 ]; then
    echo "   ✅ MongoDB: Port accessible!"
else
    echo "   ❌ MongoDB: Port not accessible"
fi

# Node.js test (if available)
echo ""
echo "3️⃣  Testing via Node.js..."
if command -v node &> /dev/null; then
    node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: '$PG_HOST', port: $PG_PORT,
      database: '$DB_NAME', user: '$DB_USER', password: '$DB_PASS'
    });
    pool.query('SELECT COUNT(*) as count FROM users')
      .then(r => { console.log('   ✅ Node.js PostgreSQL: OK (users:', r.rows[0].count + ')'); pool.end(); })
      .catch(e => { console.log('   ❌ Node.js PostgreSQL:', e.message); pool.end(); });
    " 2>/dev/null || echo "   ⚠️  pg module not found, skip Node.js test"
else
    echo "   ⚠️  Node.js not found, skip"
fi

echo ""
echo "===================================="
echo "📋 Connection Info for .env:"
echo ""
echo "DB_HOST=$PG_HOST"
echo "DB_PORT=$PG_PORT"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASS"
echo ""
echo "MONGODB_URI=mongodb://$DB_USER:$DB_PASS@$MONGO_HOST:$MONGO_PORT/smartfactory_media?authSource=admin"
echo ""
