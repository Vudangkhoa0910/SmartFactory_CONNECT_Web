/**
 * =============================================================
 * RATE LIMITING MIDDLEWARE - Protection for SmartFactory CONNECT
 * =============================================================
 * 
 * Provides multiple rate limiting strategies to protect the API
 * from abuse and ensure fair usage for all users.
 */

const rateLimit = require('express-rate-limit');
const cacheService = require('../services/cache.service');

// ============================================================
// CONFIGURATION
// ============================================================

const isProduction = process.env.NODE_ENV === 'production';

// Rate limit configurations
const configs = {
  // General API - 100 requests per minute (500 in dev for React Strict Mode)
  general: {
    windowMs: 60 * 1000, // 1 minute
    max: isProduction ? 100 : 500, // Higher limit in development
    message: {
      status: 429,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60,
    },
  },
  
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 20 : 100, // Higher limit in development
    message: {
      status: 429,
      error: 'Too many authentication attempts',
      message: 'Please wait before trying again.',
      retryAfter: 900,
    },
  },
  
  // Login specifically - very strict
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 20, // Higher limit in development
    message: {
      status: 429,
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
      retryAfter: 900,
    },
  },
  
  // File uploads - limited
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: isProduction ? 10 : 50, // Higher limit in development
    message: {
      status: 429,
      error: 'Upload limit reached',
      message: 'Please wait before uploading more files.',
      retryAfter: 60,
    },
  },
  
  // AI/Chat endpoints - expensive operations
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: isProduction ? 20 : 100, // Higher limit in development
    message: {
      status: 429,
      error: 'AI rate limit exceeded',
      message: 'Please slow down your AI requests.',
      retryAfter: 60,
    },
  },
  
  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: isProduction ? 50 : 200, // Higher limit in development
    message: {
      status: 429,
      error: 'Admin rate limit exceeded',
      message: 'Please try again later.',
      retryAfter: 60,
    },
  },
};

// ============================================================
// CUSTOM KEY GENERATORS
// ============================================================

/**
 * Key generator based on IP address
 */
const ipKeyGenerator = (req) => {
  return req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0].trim() || 
    req.socket?.remoteAddress || 
    'unknown';
};

/**
 * Key generator based on authenticated user
 */
const userKeyGenerator = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return ipKeyGenerator(req);
};

/**
 * Key generator combining IP and endpoint
 */
const endpointKeyGenerator = (req) => {
  const ip = ipKeyGenerator(req);
  const endpoint = req.baseUrl + req.path;
  return `${ip}:${endpoint}`;
};

// ============================================================
// SKIP FUNCTIONS
// ============================================================

/**
 * Skip rate limiting for certain requests
 */
const skipInDevelopment = (req) => {
  // Skip in development unless explicitly testing
  if (!isProduction && !process.env.ENABLE_RATE_LIMIT) {
    return true;
  }
  return false;
};

/**
 * Skip for health checks and monitoring
 */
const skipHealthChecks = (req) => {
  const skipPaths = ['/health', '/metrics', '/ready', '/live'];
  return skipPaths.includes(req.path);
};

// ============================================================
// RATE LIMITERS
// ============================================================

/**
 * Create rate limiter with custom configuration
 */
const createLimiter = (config, options = {}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
    keyGenerator: options.keyGenerator || ipKeyGenerator,
    skip: (req) => {
      if (skipHealthChecks(req)) return true;
      if (options.skip) return options.skip(req);
      return skipInDevelopment(req);
    },
    handler: (req, res, next, options) => {
      res.status(429).json(config.message);
    },
  });
};

// Pre-configured limiters
const generalLimiter = createLimiter(configs.general);
const authLimiter = createLimiter(configs.auth);
const loginLimiter = createLimiter(configs.login, {
  keyGenerator: endpointKeyGenerator,
});
const uploadLimiter = createLimiter(configs.upload, {
  keyGenerator: userKeyGenerator,
});
const aiLimiter = createLimiter(configs.ai, {
  keyGenerator: userKeyGenerator,
});
const adminLimiter = createLimiter(configs.admin, {
  keyGenerator: userKeyGenerator,
});

// ============================================================
// SLIDING WINDOW RATE LIMITER (Custom Implementation)
// ============================================================

/**
 * Sliding window rate limiter using cache service
 * More accurate than fixed window approach
 */
const slidingWindowLimiter = (limit, windowSeconds) => {
  return async (req, res, next) => {
    const key = userKeyGenerator(req);
    const result = cacheService.rateLimitCache.check(key, limit, windowSeconds);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetIn);
    
    if (!result.allowed) {
      return res.status(429).json({
        status: 429,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.resetIn,
      });
    }
    
    next();
  };
};

// ============================================================
// DYNAMIC RATE LIMITER
// ============================================================

/**
 * Dynamic rate limiter based on user role
 */
const dynamicLimiter = (baseLimit, windowMs = 60000) => {
  return (req, res, next) => {
    let limit = baseLimit;
    
    // Adjust limit based on user role
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          limit = baseLimit * 5; // Admins get 5x limit
          break;
        case 'safety_manager':
        case 'production_manager':
          limit = baseLimit * 3; // Managers get 3x limit
          break;
        case 'team_leader':
          limit = baseLimit * 2; // Team leaders get 2x limit
          break;
        default:
          limit = baseLimit; // Default for employees
      }
    }
    
    const key = userKeyGenerator(req);
    const result = cacheService.rateLimitCache.check(key, limit, windowMs / 1000);
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    
    if (!result.allowed) {
      return res.status(429).json({
        status: 429,
        error: 'Rate limit exceeded',
        remaining: 0,
        retryAfter: result.resetIn,
      });
    }
    
    next();
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Pre-configured limiters
  generalLimiter,
  authLimiter,
  loginLimiter,
  uploadLimiter,
  aiLimiter,
  adminLimiter,
  
  // Factory functions
  createLimiter,
  slidingWindowLimiter,
  dynamicLimiter,
  
  // Key generators
  ipKeyGenerator,
  userKeyGenerator,
  endpointKeyGenerator,
  
  // Configurations for customization
  configs,
};
