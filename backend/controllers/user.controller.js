const userService = require('../services/user.service');
const {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validators/user.validator');
const { comparePassword } = require('../utils/passwordUtils');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const prisma = require('../config/db');
const notificationService = require('../services/notification.service');

// ─── Admin: Manage all users ───────────────────────────────────────────────

/**
 * GET /api/admin/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await userService.getPlatformStats();
    return sendSuccess(res, stats, 'Platform stats retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students?page=1&limit=10&search=
 * GET /api/teachers?page=1&limit=10&search=
 */
const getUsersByRole = (role) => async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search?.trim() || '';

    const { users, total } = await userService.getUsersByRole({ role, page, limit, search });
    return sendPaginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
};

const getStudents = getUsersByRole('STUDENT');
const getTeachers = getUsersByRole('TEACHER');

/**
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user, 'User retrieved.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * POST /api/students  or  POST /api/teachers
 */
const createUser = (role) => async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse({ ...req.body, role });
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const user = await userService.createUser(parsed.data);
    
    await notificationService.notifyRole('ADMIN', `${role.charAt(0) + role.slice(1).toLowerCase()} Account Created`, `${user.fullName} (${user.email}) was created.`, 'INFO');

    return sendSuccess(res, user, `${role.charAt(0) + role.slice(1).toLowerCase()} created successfully.`, 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const createStudent = createUser('STUDENT');
const createTeacher = createUser('TEACHER');

/**
 * PUT /api/students/:id  or  PUT /api/teachers/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const previousUser = await userService.getUserById(req.params.id);
    const user = await userService.updateUser(req.params.id, parsed.data);

    if (parsed.data.isActive !== undefined && parsed.data.isActive !== previousUser.isActive) {
      const status = user.isActive ? 'activated' : 'deactivated';
      const roleStr = user.role.charAt(0) + user.role.slice(1).toLowerCase();
      await notificationService.notifyRole('ADMIN', `${roleStr} Account ${status.charAt(0).toUpperCase() + status.slice(1)}`, `${user.fullName} was ${status}.`, 'INFO');
    }

    return sendSuccess(res, user, 'User updated successfully.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * DELETE /api/students/:id  or  DELETE /api/teachers/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return sendError(res, 'You cannot delete your own account.', 400);
    }

    await userService.deleteUser(req.params.id);
    return sendSuccess(res, null, 'User deleted successfully.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    await userService.resetUserPassword(req.params.id, parsed.data.newPassword);
    return sendSuccess(res, null, 'Password reset successfully.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

// ─── Any Authenticated User: Own Profile ───────────────────────────────────

/**
 * PUT /api/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    // Only allow fullName and email changes on own profile
    const { fullName, email } = parsed.data;
    const user = await userService.updateUser(req.user.id, { fullName, email });
    return sendSuccess(res, user, 'Profile updated successfully.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * PUT /api/profile/password
 */
const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await comparePassword(parsed.data.currentPassword, user.password);
    if (!isValid) {
      return sendError(res, 'Current password is incorrect.', 401);
    }

    await userService.changeOwnPassword(req.user.id, parsed.data.newPassword);
    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = {
  getStats,
  getStudents,
  getTeachers,
  getUserById,
  createStudent,
  createTeacher,
  updateUser,
  deleteUser,
  resetPassword,
  updateProfile,
  changePassword,
};
