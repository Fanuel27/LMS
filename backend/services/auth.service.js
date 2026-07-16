const prisma = require('../config/db');
const { comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/generateToken');

/**
 * Authenticate a user by email, password, and expected role.
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {{ user: object, token: string }}
 */
const loginUser = async (email, password, role) => {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  // Role check — each role has its own login endpoint
  if (user.role !== role) {
    throw { statusCode: 403, message: `This account is not registered as a ${role.toLowerCase()}.` };
  }

  // Active check
  if (!user.isActive) {
    throw { statusCode: 403, message: 'Your account has been deactivated. Please contact your administrator.' };
  }

  // Password check
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  // Generate JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Return safe user object (no password)
  const { password: _pw, ...safeUser } = user;

  return { user: safeUser, token };
};

/**
 * Fetch the current authenticated user's profile (no password)
 * @param {string} userId
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User not found.' };
  }

  return user;
};

module.exports = { loginUser, getProfile };
