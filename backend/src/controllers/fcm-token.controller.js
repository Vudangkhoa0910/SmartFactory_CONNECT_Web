const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

/**
 * Register or update FCM token for a user
 * POST /api/users/fcm-token
 */
const registerFcmToken = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { token, deviceName, devicePlatform } = req.body;

    if (!token) {
        throw new AppError('FCM token is required', 400);
    }

    try {
        // Try to create table if not exists
        await db.query(`
      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fcm_token TEXT NOT NULL UNIQUE,
        device_name VARCHAR(255),
        device_platform VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Upsert token - if token exists, update user_id (device changed user)
        // If same user, update device info
        const result = await db.query(`
      INSERT INTO user_fcm_tokens (user_id, fcm_token, device_name, device_platform)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (fcm_token) 
      DO UPDATE SET 
        user_id = $1,
        device_name = COALESCE($3, user_fcm_tokens.device_name),
        device_platform = COALESCE($4, user_fcm_tokens.device_platform),
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, token, deviceName || null, devicePlatform || null]);

        console.log(`FCM: Token registered for user ${userId}`);

        res.json({
            success: true,
            message: 'FCM token registered successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('FCM: Error registering token -', error.message);
        throw new AppError('Failed to register FCM token', 500);
    }
});

/**
 * Remove FCM token (logout from device)
 * DELETE /api/users/fcm-token
 */
const removeFcmToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new AppError('FCM token is required', 400);
    }

    try {
        await db.query(`
      UPDATE user_fcm_tokens 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE fcm_token = $1
    `, [token]);

        console.log('FCM: Token deactivated');

        res.json({
            success: true,
            message: 'FCM token removed successfully'
        });
    } catch (error) {
        console.error('FCM: Error removing token -', error.message);
        throw new AppError('Failed to remove FCM token', 500);
    }
});

/**
 * Get all active FCM tokens for a user
 * Internal use only
 */
const getUserFcmTokens = async (userId) => {
    try {
        const result = await db.query(`
      SELECT fcm_token 
      FROM user_fcm_tokens 
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

        return result.rows.map(row => row.fcm_token);
    } catch (error) {
        console.error('FCM: Error getting user tokens -', error.message);
        return [];
    }
};

/**
 * Get all active FCM tokens for multiple users
 * Internal use only
 */
const getMultipleUsersFcmTokens = async (userIds) => {
    if (!userIds || userIds.length === 0) return [];

    try {
        const result = await db.query(`
      SELECT fcm_token 
      FROM user_fcm_tokens 
      WHERE user_id = ANY($1) AND is_active = true
    `, [userIds]);

        return result.rows.map(row => row.fcm_token);
    } catch (error) {
        console.error('FCM: Error getting multiple user tokens -', error.message);
        return [];
    }
};

/**
 * Get all active FCM tokens for a department
 * Internal use only
 */
const getDepartmentFcmTokens = async (departmentId) => {
    try {
        const result = await db.query(`
      SELECT t.fcm_token 
      FROM user_fcm_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE u.department_id = $1 AND t.is_active = true AND u.is_active = true
    `, [departmentId]);

        return result.rows.map(row => row.fcm_token);
    } catch (error) {
        console.error('FCM: Error getting department tokens -', error.message);
        return [];
    }
};

/**
 * Clean up expired/invalid tokens
 * Should be called periodically
 */
const cleanupInvalidTokens = async (invalidTokens) => {
    if (!invalidTokens || invalidTokens.length === 0) return;

    try {
        await db.query(`
      UPDATE user_fcm_tokens 
      SET is_active = false 
      WHERE fcm_token = ANY($1)
    `, [invalidTokens]);

        console.log(`FCM: Cleaned up ${invalidTokens.length} invalid tokens`);
    } catch (error) {
        console.error('FCM: Error cleaning up tokens -', error.message);
    }
};

module.exports = {
    registerFcmToken,
    removeFcmToken,
    getUserFcmTokens,
    getMultipleUsersFcmTokens,
    getDepartmentFcmTokens,
    cleanupInvalidTokens
};
