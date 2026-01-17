/**
 * =============================================================
 * AUTH MIDDLEWARE - SmartFactory CONNECT
 * =============================================================
 * Unified authentication and authorization middleware
 * Uses centralized role constants from /constants/roles.js
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const {
  ROLES,
  LEVELS,
  DATA_SCOPES,
  getDataScopeByLevel,
  hasWebAccess,
  canManageUsers,
  canViewPinkBox,
  canReviewIdeas,
  canCreateNews,
  canManageRooms,
  canApproveRoomBookings,
  canBookAllRooms,
  isValidRole
} = require('../constants/roles');

/**
 * Get comprehensive data scope based on user role and level
 * Based on SRS Section 9: Vai trò & quyền hạn
 * @param {Object} user - User object with role, level, department_id
 * @returns {Object} Data scope configuration
 */
const getDataScope = (user) => {
  const { role, level, department_id } = user;
  const scope = getDataScopeByLevel(level);
  
  // Build permissions from centralized constants
  const permissions = {
    scope,
    departments: null,
    canViewAll: level <= LEVELS.MANAGER,
    canManageUsers: canManageUsers(role),
    canViewPinkBox: canViewPinkBox(role),
    canReviewIdeas: canReviewIdeas(role),
    canCreateNews: canCreateNews(role),
    canManageRooms: canManageRooms(role),
    canApproveRoomBookings: canApproveRoomBookings(role),
    canBookAllRooms: canBookAllRooms(role),
    hasWebAccess: hasWebAccess(role)
  };
  
  // Set department restrictions based on scope
  switch (scope) {
    case DATA_SCOPES.ALL:
      permissions.departments = null; // No restriction
      break;
    case DATA_SCOPES.DEPARTMENT:
    case DATA_SCOPES.TEAM:
      permissions.departments = department_id ? [department_id] : [];
      break;
    case DATA_SCOPES.SELF:
    default:
      permissions.departments = null;
      break;
  }
  
  return permissions;
};

/**
 * Middleware to verify JWT token and load user data
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load full user data from database
    const userQuery = `
      SELECT 
        u.id, u.employee_code, u.email, u.full_name,
        u.phone, u.role, u.level, u.department_id,
        u.avatar_url,
        d.name as department_name,
        d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const result = await db.query(userQuery, [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const user = result.rows[0];
    
    // Validate that user's role is still valid
    if (!isValidRole(user.role)) {
      console.warn(`User ${user.id} has invalid role: ${user.role}`);
    }
    
    // Add user info and data scope to request
    req.user = user;
    req.dataScope = getDataScope(user);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization denied.'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to check user roles
 * @param {Array} allowedRoles - Array of allowed role names
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to check role level
 * Based on SRS Level hierarchy:
 * - Level 1: Admin, General Manager (Full access)
 * - Level 2: Manager (Management access)
 * - Level 3: Supervisor (Department scope)
 * - Level 4: Team Leader (Team scope)
 * - Level 5: Operators (Self scope)
 * - Level 6: Viewer (Read-only)
 * 
 * @param {Number} maxLevel - Maximum allowed level (1=highest authority, 6=lowest)
 */
const authorizeLevel = (maxLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // User's level must be <= maxLevel to have access
    // Lower level number = higher authority
    if (req.user.level > maxLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role level.',
        requiredLevel: `Level ${maxLevel} or higher`,
        yourLevel: req.user.level
      });
    }

    next();
  };
};

/**
 * Middleware to restrict access to web dashboard
 * Based on SRS: Web Dashboard for Command Room, Team Leaders, and Management
 */
const authorizeWebAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!hasWebAccess(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This account type cannot access the Web portal.',
      hint: 'Please use the Mobile App instead.'
    });
  }

  next();
};

/**
 * Check if user is self or has higher authority
 */
const authorizeSelfOrHigher = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Allow if user is accessing their own data or has supervisor level or higher
  if (req.user.id === targetUserId || req.user.level <= LEVELS.SUPERVISOR) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own data.'
  });
};

/**
 * Middleware to check if user can access pink box (anonymous ideas)
 * Based on SRS: Only Admin can manage pink box
 */
const authorizePinkBoxAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!canViewPinkBox(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Pink Box is restricted to Admin only.'
    });
  }

  next();
};

/**
 * Middleware to check if user can manage other users
 */
const authorizeUserManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Admin can manage users.'
    });
  }

  next();
};

/**
 * Middleware to check department access
 * User can only access data from their own department unless they have higher authority
 */
const authorizeDepartmentAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const targetDepartmentId = req.params.departmentId || req.body.department_id || req.query.department_id;
  
  // Users with level 1-2 can access all departments
  if (req.user.level <= LEVELS.MANAGER) {
    return next();
  }
  
  // Users with level 3+ can only access their own department
  if (targetDepartmentId && req.user.department_id !== targetDepartmentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own department data.'
    });
  }

  next();
};

/**
 * Middleware to check if user can manage rooms
 * Only Admin can create/update/delete rooms
 */
const authorizeRoomManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!canManageRooms(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Admin can manage rooms.'
    });
  }

  next();
};

/**
 * Middleware to check if user can approve room bookings
 * Supervisor and above can approve
 */
const authorizeRoomApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!canApproveRoomBookings(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Supervisor and above can approve room bookings.',
      requiredLevel: 'Level 3 (Supervisor) or higher',
      yourLevel: req.user.level
    });
  }

  next();
};

module.exports = {
  // Authentication
  authenticate,
  
  // Authorization
  authorize,
  authorizeLevel,
  authorizeWebAccess,
  authorizeSelfOrHigher,
  authorizePinkBoxAccess,
  authorizeUserManagement,
  authorizeDepartmentAccess,
  authorizeRoomManagement,
  authorizeRoomApproval,
  
  // Helpers
  getDataScope
};
