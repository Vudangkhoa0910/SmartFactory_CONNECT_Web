const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Log validation errors for debugging
    console.error('❌ Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      errors: errors.array()
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

/**
 * Middleware for pagination
 */
const pagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_SIZE) || 20;
  const maxLimit = parseInt(process.env.MAX_PAGE_SIZE) || 100;

  // Validate and set limits
  req.pagination = {
    page: page > 0 ? page : 1,
    limit: limit > maxLimit ? maxLimit : (limit > 0 ? limit : 20),
    offset: ((page > 0 ? page : 1) - 1) * (limit > 0 ? limit : 20)
  };

  next();
};

/**
 * Middleware to parse sort parameters
 */
const parseSort = (req, res, next) => {
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = req.query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  req.sort = {
    sortBy,
    sortOrder
  };

  next();
};

/**
 * Middleware to parse filter parameters
 */
const parseFilters = (allowedFilters = []) => {
  return (req, res, next) => {
    const filters = {};

    allowedFilters.forEach(filter => {
      if (req.query[filter]) {
        filters[filter] = req.query[filter];
      }
    });

    req.filters = filters;
    next();
  };
};

/**
 * Middleware to sanitize user input
 */
const sanitizeInput = (req, res, next) => {
  // Remove any null bytes
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  validate,
  pagination,
  parseSort,
  parseFilters,
  sanitizeInput
};
