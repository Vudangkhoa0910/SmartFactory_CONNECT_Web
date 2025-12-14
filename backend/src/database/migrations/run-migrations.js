/**
 * Migration Runner Script
 * Run database migrations in order
 * 
 * Usage: node src/database/migrations/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartfactory_db',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
});

// Migration files to run in order
const migrations = [
  '002_optimization_scale.sql',
  '003_fix_schema_issues.sql',
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get already executed migrations
    const { rows: executed } = await client.query(
      'SELECT name FROM _migrations'
    );
    const executedNames = executed.map(r => r.name);
    
    // Run pending migrations
    for (const migrationFile of migrations) {
      if (executedNames.includes(migrationFile)) {
        console.log(`⏭️  Skipping ${migrationFile} (already executed)`);
        continue;
      }
      
      const migrationPath = path.join(__dirname, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migrationFile}`);
        continue;
      }
      
      console.log(`📄 Running migration: ${migrationFile}`);
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query('BEGIN');
      
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [migrationFile]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed: ${migrationFile}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${migrationFile}`);
        console.error(`   Error: ${error.message}\n`);
        
        // Continue with other migrations or exit
        if (process.env.MIGRATION_STOP_ON_ERROR === 'true') {
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed!');
    
    // Show current schema status
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Current database tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
