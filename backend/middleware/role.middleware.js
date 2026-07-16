const { sendError } = require('../utils/response');

/**
 * Factory: returns middleware that restricts access to specified roles.
 * Must be used AFTER authenticate middleware.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, requireRole('ADMIN'), handler)
 *   router.get('/teacher/q', authenticate, requireRole('ADMIN', 'TEACHER'), handler)
 *
 * @param {...string} roles  - Allowed roles (ADMIN, TEACHER, STUDENT)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}.`,
        403
      );
    }

    next();
  };
};

module.exports = { requireRole };
