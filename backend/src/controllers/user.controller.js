const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

/**
 * Get all users with filters
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { pagination, sort, filters } = req;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Apply filters
  if (filters.role) {
    conditions.push(`u.role = $${paramIndex}`);
    params.push(filters.role);
    paramIndex++;
  }
  
  if (filters.department_id) {
    conditions.push(`u.department_id = $${paramIndex}`);
    params.push(filters.department_id);
    paramIndex++;
  }
  
  if (filters.is_active !== undefined) {
    conditions.push(`u.is_active = $${paramIndex}`);
    params.push(filters.is_active === 'true');
    paramIndex++;
  }
  
  if (filters.search) {
    conditions.push(`(
      u.full_name ILIKE $${paramIndex} OR 
      u.email ILIKE $${paramIndex} OR 
      u.employee_code ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);
  
  // Get users with pagination
  const query = `
    SELECT 
      u.id,
      u.employee_code,
      u.email,
      u.full_name,
      u.phone,
      u.role,
      u.level,
      u.department_id,
      u.is_active,
      u.created_at,
      u.last_login,
      d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ${whereClause}
    ORDER BY ${sort.sortBy} ${sort.sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(pagination.limit, pagination.offset);
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit)
    }
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      u.id,
      u.employee_code,
      u.email,
      u.full_name,
      u.phone,
      u.role,
      u.level,
      u.department_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      u.last_login,
      d.name as department_name,
      d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = $1
  `;
  
  const result = await db.query(query, [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Create new user
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const {
    employee_code,
    email,
    password,
    full_name,
    phone,
    department_id,
    role
  } = req.body;
  
  // Check if user already exists
  const existingUser = await db.query(
    'SELECT * FROM users WHERE email = $1 OR employee_code = $2',
    [email, employee_code]
  );
  
  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email or employee code already exists', 409);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Map role to level
  const roleToLevel = {
    'admin': 1,
    'factory_manager': 2,
    'production_manager': 3,
    'supervisor': 4,
    'team_leader': 5,
    'operator': 6,
    'technician': 7,
    'qc_inspector': 8,
    'maintenance_manager': 9,
    'maintenance_staff': 9,
    'viewer': 10
  };
  
  const level = roleToLevel[role] || 10;
  
  const query = `
    INSERT INTO users (
      employee_code,
      email,
      password,
      full_name,
      phone,
      department_id,
      role,
      level,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    RETURNING id, employee_code, email, full_name, phone, department_id, role, level, is_active, created_at
  `;
  
  const result = await db.query(query, [
    employee_code,
    email,
    hashedPassword,
    full_name,
    phone || null,
    department_id || null,
    role,
    level
  ]);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: result.rows[0]
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    employee_code,
    email,
    full_name,
    phone,
    department_id,
    role,
    is_active
  } = req.body;
  
  // Check if user exists
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (user.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  // Check if email or employee_code is already taken by another user
  if (email || employee_code) {
    const existingUser = await db.query(
      'SELECT id FROM users WHERE (email = $1 OR employee_code = $2) AND id != $3',
      [email || user.rows[0].email, employee_code || user.rows[0].employee_code, id]
    );
    
    if (existingUser.rows.length > 0) {
      throw new AppError('Email or employee code is already in use', 409);
    }
  }
  
  // Map role to level if role is provided
  let level = user.rows[0].level;
  if (role) {
    const roleToLevel = {
      'admin': 1,
      'factory_manager': 2,
      'production_manager': 3,
      'supervisor': 4,
      'team_leader': 5,
      'operator': 6,
      'technician': 7,
      'qc_inspector': 8,
      'maintenance_manager': 9,
      'maintenance_staff': 9,
      'viewer': 10
    };
    level = roleToLevel[role] || 10;
  }
  
  const query = `
    UPDATE users
    SET 
      employee_code = COALESCE($1, employee_code),
      email = COALESCE($2, email),
      full_name = COALESCE($3, full_name),
      phone = COALESCE($4, phone),
      department_id = COALESCE($5, department_id),
      role = COALESCE($6, role),
      level = $7,
      is_active = COALESCE($8, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING id, employee_code, email, full_name, phone, department_id, role, level, is_active, updated_at
  `;
  
  const result = await db.query(query, [
    employee_code,
    email,
    full_name,
    phone,
    department_id,
    role,
    level,
    is_active,
    id
  ]);
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: result.rows[0]
  });
});

/**
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if user exists
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (user.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  // Prevent deleting own account
  if (id === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }
  
  // Soft delete by deactivating
  await db.query(
    'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
  
  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

/**
 * Reset user password
 * POST /api/users/:id/reset-password
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  
  // Check if user exists
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (user.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(new_password, 12);
  
  // Update password
  await db.query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, id]
  );
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * Get user statistics
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
      COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
      COUNT(CASE WHEN last_login >= CURRENT_DATE THEN 1 END) as logged_in_today
    FROM users
  `;
  
  const statsResult = await db.query(statsQuery);
  
  // By role
  const byRoleQuery = `
    SELECT 
      role,
      COUNT(*) as count
    FROM users
    WHERE is_active = true
    GROUP BY role
    ORDER BY count DESC
  `;
  
  const byRoleResult = await db.query(byRoleQuery);
  
  // By department
  const byDepartmentQuery = `
    SELECT 
      d.name as department_name,
      COUNT(*) as count
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_active = true
    GROUP BY d.name
    ORDER BY count DESC
  `;
  
  const byDepartmentResult = await db.query(byDepartmentQuery);
  
  // Recent registrations
  const recentQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  const recentResult = await db.query(recentQuery);
  
  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      by_role: byRoleResult.rows,
      by_department: byDepartmentResult.rows,
      recent_registrations: recentResult.rows
    }
  });
});

/**
 * Update current user preferences
 * PUT /api/users/preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { preferred_language } = req.body;
  
  // Build update query
  const updates = [];
  const params = [];
  let paramIndex = 1;
  
  if (preferred_language !== undefined) {
    updates.push(`preferred_language = $${paramIndex}`);
    params.push(preferred_language);
    paramIndex++;
  }
  
  if (updates.length === 0) {
    return res.json({
      success: true,
      message: 'No preferences to update'
    });
  }
  
  params.push(userId);
  
  const query = `
    UPDATE users 
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING id, preferred_language
  `;
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: result.rows[0]
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserStats,
  updatePreferences
};
