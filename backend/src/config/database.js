const { Pool } = require('pg');
require('dotenv').config();

// ============================================================
// DATABASE CONFIGURATION OPTIMIZED FOR 2000-3000 USERS
// ============================================================

const isProduction = process.env.NODE_ENV === 'production';

// Pool configuration based on expected load
// Formula: connections = (cpu_cores * 2) + effective_spindle_count
// For cloud/container: typically 20-50 connections per instance

// Handle empty password string from .env (fix for SASL error)
// pg driver requires undefined for no password, not empty string
const dbPassword = process.env.DB_PASSWORD;
const password = (dbPassword && dbPassword.trim() !== '') ? dbPassword : undefined;

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'smartfactory_db',
  user: process.env.DB_USER || process.env.USER,
  password: password,
  
  // Connection pool settings optimized for scale
  max: parseInt(process.env.DB_POOL_MAX) || 50,           // Max connections in pool
  min: parseInt(process.env.DB_POOL_MIN) || 10,           // Min connections to keep
  idleTimeoutMillis: 30000,                               // Close idle connections after 30s
  connectionTimeoutMillis: 5000,                          // Timeout waiting for connection
  
  // Statement timeout to prevent long-running queries
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  
  // Keep-alive for connection stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Application name for monitoring
  application_name: 'smartfactory_connect',
};

// SSL configuration for production
if (isProduction && process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ca: process.env.DB_SSL_CA || undefined,
  };
}

const pool = new Pool(poolConfig);

// Connection event handlers
pool.on('connect', (client) => {
  // Set session parameters for optimization
  client.query('SET timezone = \'Asia/Ho_Chi_Minh\'');
  if (!isProduction) {
    console.log('✅ Database client connected');
  }
});

pool.on('acquire', () => {
  // Track connection acquisition for monitoring
  poolStats.acquired++;
});

pool.on('release', () => {
  // Track connection release
  poolStats.released++;
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error:', err);
  // Don't exit in production, let the pool recover
  if (!isProduction) {
    process.exit(-1);
  }
});

// Pool statistics for monitoring
const poolStats = {
  acquired: 0,
  released: 0,
  queries: 0,
  errors: 0,
  slowQueries: 0,
};

// Slow query threshold (ms)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000;

/**
 * Optimized query function with logging and metrics
 */
const query = async (text, params) => {
  const start = Date.now();
  poolStats.queries++;
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries for optimization
    if (duration > SLOW_QUERY_THRESHOLD) {
      poolStats.slowQueries++;
      console.warn('🐢 Slow query detected:', {
        query: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    } else if (!isProduction) {
      // Only log in development
      console.log('Query executed:', { duration: `${duration}ms`, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    poolStats.errors++;
    console.error('❌ Query error:', {
      query: text.substring(0, 200),
      error: error.message,
    });
    throw error;
  }
};

/**
 * Transaction helper with automatic retry for deadlocks
 */
const transaction = async (callback, retries = 3) => {
  const client = await pool.connect();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Retry on deadlock (PostgreSQL error code 40P01)
      if (error.code === '40P01' && attempt < retries) {
        console.warn(`⚠️ Deadlock detected, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        continue;
      }
      
      throw error;
    } finally {
      if (attempt === retries || !['40P01'].includes(error?.code)) {
        client.release();
      }
    }
  }
};

/**
 * Batch insert for bulk operations (much faster than individual inserts)
 */
const batchInsert = async (table, columns, rows, chunkSize = 1000) => {
  if (!rows.length) return { rowCount: 0 };
  
  const results = [];
  
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const placeholders = [];
    
    chunk.forEach((row, rowIndex) => {
      const rowPlaceholders = columns.map((_, colIndex) => {
        values.push(row[colIndex]);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    const result = await query(sql, values);
    results.push(result);
  }
  
  return {
    rowCount: results.reduce((sum, r) => sum + r.rowCount, 0),
  };
};

/**
 * Get pool statistics for monitoring
 */
const getPoolStats = () => ({
  ...poolStats,
  totalConnections: pool.totalCount,
  idleConnections: pool.idleCount,
  waitingRequests: pool.waitingCount,
});

/**
 * Health check for the database connection
 */
const healthCheck = async () => {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT 1 as health');
    return {
      status: 'healthy',
      latency: Date.now() - start,
      pool: getPoolStats(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      pool: getPoolStats(),
    };
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
};

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  pool,
  query,
  transaction,
  batchInsert,
  getPoolStats,
  healthCheck,
  shutdown,
};
