const { verifyToken } = require('../utils/generateToken');
const { sendError } = require('../utils/response');

/**
 * Middleware: verifies the JWT from httpOnly cookie or Authorization header.
 * Sets req.user = { id, email, role }
 */
const authenticate = (req, res, next) => {
  try {
    // Support both cookie-based and Bearer token auth
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

module.exports = { authenticate };
