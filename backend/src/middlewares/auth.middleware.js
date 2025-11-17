const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Get data scope based on user role
 */
const getDataScope = (user) => {
  const { role, level, department_id } = user;
  
  // Admin & Factory Manager: See everything
  if (level <= 2) {
    return { 
      scope: 'all', 
      departments: null, 
      canViewAll: true,
      canManageUsers: level === 1,
      canViewPinkBox: level === 1
    };
  }
  
  // Supervisor: See multiple departments (configurable)
  if (role === 'supervisor') {
    return { 
      scope: 'multi_department', 
      departments: null, // Can be configured per supervisor
      canViewAll: true,
      canManageUsers: false,
      canViewPinkBox: false
    };
  }
  
  // Department Managers: See own department only
  if (level === 3 && department_id) {
    return { 
      scope: 'department', 
      departments: [department_id],
      canViewAll: false,
      canManageUsers: false,
      canViewPinkBox: false
    };
  }
  
  // Team Leaders: See own team only
  if (role === 'team_leader' && department_id) {
    return { 
      scope: 'team', 
      departments: [department_id],
      canViewAll: false,
      canManageUsers: false,
      canViewPinkBox: false
    };
  }
  
  // Operators: See only their own data
  return { 
    scope: 'self',
    departments: null,
    canViewAll: false,
    canManageUsers: false,
    canViewPinkBox: false
  };
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
        u.id, u.employee_code, u.username, u.email, u.full_name,
        u.phone, u.avatar_url, u.role, u.level, u.department_id,
        d.name as department_name
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

    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
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
 * @param {Number} minLevel - Minimum role level required (1=highest, 10=lowest)
 */
const authorizeLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (req.user.level > minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role level.',
        requiredLevel: minLevel,
        yourLevel: req.user.level
      });
    }

    next();
  };
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

  // Allow if user is accessing their own data or has admin/manager level
  if (req.user.id === targetUserId || req.user.level <= 3) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own data.'
  });
};

module.exports = {
  authenticate,
  authorize,
  authorizeLevel,
  authorizeSelfOrHigher,
  getDataScope
};
