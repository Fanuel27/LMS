const { loginSchema } = require('../validators/auth.validator');
const { loginUser, getProfile } = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * POST /api/auth/login
 * Body: { email, password, role }
 */
const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const { email, password, role } = parsed.data;
    const { user, token } = await loginUser(email, password, role);

    // Set httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    return sendSuccess(res, { user, token }, 'Login successful.');
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  return sendSuccess(res, null, 'Logged out successfully.');
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
const me = async (req, res, next) => {
  try {
    const user = await getProfile(req.user.id);
    return sendSuccess(res, user, 'Profile retrieved.');
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = { login, logout, me };
