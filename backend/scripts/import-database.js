/**
 * Database Import Script
 * Imports JSON data files back into PostgreSQL
 * 
 * Usage: node scripts/import-database.js [--clean]
 * Options:
 *   --clean  Clear existing data before import (use with caution!)
 * 
 * Input: data-exports/*.json
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
const CLEAN_MODE = process.argv.includes('--clean');

// Import order (respecting foreign key dependencies)
const IMPORT_ORDER = [
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

async function clearTable(tableName) {
  try {
    await pool.query(`DELETE FROM ${tableName}`);
    console.log(`🗑️  Cleared ${tableName}`);
  } catch (error) {
    console.error(`❌ Error clearing ${tableName}:`, error.message);
  }
}

async function importTable(tableName) {
  const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${tableName}: No export file found`);
    return 0;
  }

  try {
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const records = fileContent.data;

    if (!records || records.length === 0) {
      console.log(`⏭️  Skipping ${tableName}: No data to import`);
      return 0;
    }

    let imported = 0;
    for (const record of records) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      try {
        await pool.query(query, values);
        imported++;
      } catch (err) {
        // Skip duplicate or constraint errors
        if (!err.message.includes('duplicate') && !err.message.includes('violates')) {
          console.error(`   Warning: ${err.message}`);
        }
      }
    }

    console.log(`✅ Imported ${tableName}: ${imported}/${records.length} records`);
    return imported;
  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting database import...\n');

  if (CLEAN_MODE) {
    console.log('⚠️  CLEAN MODE: Clearing existing data...\n');
    // Clear in reverse order to respect foreign keys
    for (const table of [...IMPORT_ORDER].reverse()) {
      await clearTable(table);
    }
    console.log('');
  }

  let totalImported = 0;
  const summary = {};

  for (const table of IMPORT_ORDER) {
    const count = await importTable(table);
    summary[table] = count;
    totalImported += count;
  }

  console.log('\n📊 Import Summary:');
  console.log(`   Total records imported: ${totalImported}`);
  console.log('\n✨ Import completed!');

  await pool.end();
}

main().catch(console.error);
