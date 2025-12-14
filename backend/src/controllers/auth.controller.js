const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const crypto = require('crypto');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
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
  
  // Create user
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
    RETURNING id, employee_code, email, full_name, phone, department_id, role, level, created_at
  `;
  
  // Map role to level
  const roleToLevel = {
    'admin': 1,
    'general_manager': 1, // GM
    'manager': 2,         // Mgr
    'supervisor': 3,      // SV
    
    // Below roles are restricted from Web access
    'team_leader': 5,
    'operator': 6,
    'technician': 7,
    'qc_inspector': 8,
    'maintenance_staff': 9,
    'viewer': 10
  };
  
  const level = roleToLevel[role] || 10;
  
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
  
  const user = result.rows[0];
  
  // Generate token
  const token = generateToken(user.id);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, employee_code, password } = req.body;
  
  console.log('🔐 Login attempt:', { email, employee_code, hasPassword: !!password });
  
  // Check if either email or employee_code is provided
  if (!email && !employee_code) {
    throw new AppError('Email or employee code is required', 400);
  }
  
  // Check if user exists by email or employee_code
  const result = await db.query(
    `SELECT 
      u.*,
      d.name as department_name,
      d.id as dept_id
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE (u.email = $1 OR u.employee_code = $2) AND u.is_active = true`,
    [email || '', employee_code || '']
  );
  
  console.log('👤 User found:', result.rows.length > 0, result.rows[0]?.email);
  
  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }
  
  const user = result.rows[0];
  
  // Verify password
  console.log('🔑 Comparing password...');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('✅ Password valid:', isPasswordValid);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check web access permission (Level <= 3: Admin, GM, Manager, Supervisor)
  // MODIFIED: Allow all users to login for Mobile App support
  // if (user.level > 3) {
  //   throw new AppError('Access denied. This account type cannot access the Web portal.', 403);
  // }
  
  // Update last login
  await db.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );
  
  // Generate token with user info
  const token = jwt.sign(
    { 
      id: user.id,
      role: user.role,
      level: user.level,
      department_id: user.department_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  // Determine permissions
  const hasWebAccess = user.level <= 3; 
  const canViewDashboard = user.level <= 3;
  const canManageUsers = user.level === 1; // Only Admin/GM
  const canViewPinkBox = user.level === 1; // Only Admin/GM
  const canReviewIdeas = user.level <= 3; // Admin, GM, Manager, Supervisor
  const canCreateNews = user.level <= 3;
  
  // Remove password from response
  delete user.password;
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role,
        level: user.level,
        department: user.department_id ? {
          id: user.dept_id,
          name: user.department_name
        } : null,
        permissions: {
          has_web_access: hasWebAccess,
          has_mobile_access: true,
          can_view_dashboard: canViewDashboard,
          can_manage_users: canManageUsers,
          can_review_ideas: canReviewIdeas,
          can_view_pink_box: canViewPinkBox,
          can_create_news: canCreateNews
        }
      }
    }
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await db.query(
    `SELECT 
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
    WHERE u.id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, email } = req.body;
  
  // Check if email is already taken by another user
  if (email) {
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    
    if (existingUser.rows.length > 0) {
      throw new AppError('Email is already in use', 409);
    }
  }
  
  const query = `
    UPDATE users
    SET 
      full_name = COALESCE($1, full_name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING id, employee_code, email, full_name, phone, role, level, department_id
  `;
  
  const result = await db.query(query, [full_name, phone, email, userId]);
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0]
  });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;
  
  // Get user with password
  const result = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }
  
  const user = result.rows[0];
  
  // Verify current password
  const isPasswordValid = await bcrypt.compare(current_password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(new_password, 12);
  
  // Update password
  await db.query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, userId]
  );
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Forgot password - send reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Get user
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  }
  
  const user = result.rows[0];
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  // Save reset token
  await db.query(
    `UPDATE users 
     SET password_reset_token = $1, password_reset_expires = $2 
     WHERE id = $3`,
    [resetTokenHash, resetTokenExpires, user.id]
  );
  
  // TODO: Send email with reset link
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  console.log('Password reset URL:', resetUrl);
  
  // In development, return the token (remove in production)
  const responseData = process.env.NODE_ENV === 'development' 
    ? { resetToken, resetUrl }
    : {};
  
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent',
    ...(process.env.NODE_ENV === 'development' && { dev: responseData })
  });
});

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { new_password } = req.body;
  
  // Hash the token to compare with database
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid token
  const result = await db.query(
    `SELECT * FROM users 
     WHERE password_reset_token = $1 
     AND password_reset_expires > CURRENT_TIMESTAMP`,
    [resetTokenHash]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired reset token', 400);
  }
  
  const user = result.rows[0];
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(new_password, 12);
  
  // Update password and clear reset token
  await db.query(
    `UPDATE users 
     SET password = $1, 
         password_reset_token = NULL, 
         password_reset_expires = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [hashedPassword, user.id]
  );
  
  res.json({
    success: true,
    message: 'Password has been reset successfully'
  });
});

/**
 * Verify token
 * GET /api/auth/verify
 */
const verifyToken = asyncHandler(async (req, res) => {
  // If middleware passed, token is valid
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyToken
};
