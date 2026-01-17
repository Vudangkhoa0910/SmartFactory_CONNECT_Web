const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

// In-memory cache for settings (can be replaced with Redis later)
let settingsCache = {
  autoAssignEnabled: true,
  lastUpdated: null
};

/**
 * Get auto-assign setting
 * GET /api/settings/auto-assign
 */
const getAutoAssignSetting = asyncHandler(async (req, res) => {
  try {
    // Try to get from database
    const result = await db.query(
      `SELECT value FROM system_settings WHERE key = 'auto_assign_enabled' LIMIT 1`
    );
    
    if (result.rows.length > 0) {
      settingsCache.autoAssignEnabled = result.rows[0].value === 'true';
    }
  } catch (error) {
    // Table might not exist, use cache
    console.log('[Settings] Using in-memory cache for auto-assign setting');
  }
  
  res.json({
    success: true,
    enabled: settingsCache.autoAssignEnabled
  });
});

/**
 * Update auto-assign setting
 * PATCH /api/settings/auto-assign
 */
const updateAutoAssignSetting = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    throw new AppError('enabled must be a boolean', 400);
  }
  
  // Update cache
  settingsCache.autoAssignEnabled = enabled;
  settingsCache.lastUpdated = new Date();
  
  try {
    // Try to persist to database
    await db.query(`
      INSERT INTO system_settings (key, value, updated_by, updated_at)
      VALUES ('auto_assign_enabled', $1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
    `, [String(enabled), req.user.id]);
  } catch (error) {
    // Table might not exist, create it
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_by UUID,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.query(`
        INSERT INTO system_settings (key, value, updated_by, updated_at)
        VALUES ('auto_assign_enabled', $1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      `, [String(enabled), req.user.id]);
    } catch (innerError) {
      console.log('[Settings] Could not persist to database, using in-memory only');
    }
  }
  
  console.log(`[Settings] Auto-assign ${enabled ? 'ENABLED' : 'DISABLED'} by user ${req.user.id}`);
  
  res.json({
    success: true,
    enabled: settingsCache.autoAssignEnabled,
    message: enabled ? 'Auto-assign enabled' : 'Auto-assign disabled'
  });
});

/**
 * Check if auto-assign is enabled (internal use)
 */
const isAutoAssignEnabled = () => {
  return settingsCache.autoAssignEnabled;
};

module.exports = {
  getAutoAssignSetting,
  updateAutoAssignSetting,
  isAutoAssignEnabled
};
