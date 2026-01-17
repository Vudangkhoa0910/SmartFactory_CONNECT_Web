/**
 * Database Export Script
 * Exports all PostgreSQL tables to JSON files for backup and team sync
 * 
 * Usage: node scripts/export-database.js
 * Output: data-exports/*.json
 */

try { require('dotenvx').config(); } catch { require('dotenv').config(); }
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartfactory_db',
  user: process.env.DB_USER || 'smartfactory',
  password: process.env.DB_PASSWORD || undefined,
});

const EXPORT_DIR = path.join(__dirname, '..', 'data-exports');

// Tables to export in order (respecting foreign key dependencies)
const TABLES = [
  'departments',
  'role_levels',
  'users',
  'booking_purposes',
  'rooms',
  'room_approval_rules',
  'room_bookings',
  'room_booking_history',
  'ideas',
  'idea_history',
  'idea_responses',
  'idea_ratings',
  'idea_status_labels',
  'incidents',
  'incident_comments',
  'incident_history',
  'incident_department_tasks',
  'news',
  'news_views',
  'news_read_receipts',
  'notifications',
  'audit_logs',
  'system_settings',
  'user_fcm_tokens',
  'kaizen_bank',
  'kaizen_evaluation_criteria',
  'kaizen_evaluation_scores',
  'kaizen_monthly_statistics',
  'kaizen_replication_history',
];

async function exportTable(tableName) {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify({
      table: tableName,
      exported_at: new Date().toISOString(),
      count: result.rows.length,
      data: result.rows
    }, null, 2));
    
    console.log(`✅ Exported ${tableName}: ${result.rows.length} records`);
    return result.rows.length;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting database export...\n');
  
  // Ensure export directory exists
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  let totalRecords = 0;
  const summary = {};

  for (const table of TABLES) {
    const count = await exportTable(table);
    summary[table] = count;
    totalRecords += count;
  }

  // Write summary
  const summaryPath = path.join(EXPORT_DIR, '_export_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    exported_at: new Date().toISOString(),
    total_tables: TABLES.length,
    total_records: totalRecords,
    tables: summary
  }, null, 2));

  console.log('\n📊 Export Summary:');
  console.log(`   Total tables: ${TABLES.length}`);
  console.log(`   Total records: ${totalRecords}`);
  console.log(`   Output: ${EXPORT_DIR}`);
  console.log('\n✨ Export completed successfully!');

  await pool.end();
}

main().catch(console.error);
