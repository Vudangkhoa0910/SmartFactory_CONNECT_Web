const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
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
    
    // Add user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      roleLevel: decoded.roleLevel,
      departmentId: decoded.departmentId
    };

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

    if (req.user.roleLevel > minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role level.',
        requiredLevel: minLevel,
        yourLevel: req.user.roleLevel
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

  // Allow if requesting own data or if role level <= 4 (supervisor and above)
  if (req.user.id === targetUserId || req.user.roleLevel <= 4) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Can only access own data.'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        roleLevel: decoded.roleLevel,
        departmentId: decoded.departmentId
      };
    }
    
    next();
  } catch (error) {
    // Continue without user info
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeLevel,
  authorizeSelfOrHigher,
  optionalAuth
};
