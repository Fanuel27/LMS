const { sendError } = require('../utils/response');

/**
 * Global error handler middleware.
 * Must be registered LAST in Express app (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Prisma known errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404);
  }

  // JWT errors (shouldn't reach here normally, handled in middleware)
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired.', 401);
  }

  // Validation errors
  if (err.name === 'ZodError') {
    return sendError(res, 'Validation failed.', 422, err.errors);
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  return sendError(res, message, statusCode);
};

/**
 * 404 handler — for unmatched routes
 */
const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.path} not found.`, 404);
};

module.exports = { errorHandler, notFoundHandler };
