/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle PostgreSQL errors
 */
const handlePostgresError = (error) => {
  // Unique constraint violation
  if (error.code === '23505') {
    const match = error.detail?.match(/Key \((.*?)\)=\((.*?)\)/);
    if (match) {
      return new AppError(`${match[1]} '${match[2]}' already exists`, 409);
    }
    return new AppError('Duplicate entry found', 409);
  }
  
  // Foreign key violation
  if (error.code === '23503') {
    return new AppError('Referenced record does not exist', 400);
  }
  
  // Not null violation
  if (error.code === '23502') {
    const field = error.column;
    return new AppError(`${field} is required`, 400);
  }
  
  // Invalid input syntax
  if (error.code === '22P02') {
    return new AppError('Invalid input format', 400);
  }
  
  return error;
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // Log error
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Handle specific error types
  let error = { ...err };
  error.message = err.message;
  
  // PostgreSQL errors
  if (err.code && err.code.startsWith('2')) {
    error = handlePostgresError(err);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please login again', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please login again', 401);
  }
  
  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File size is too large', 400);
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError('Unexpected file field', 400);
    } else {
      error = new AppError(err.message, 400);
    }
  }
  
  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler
};
