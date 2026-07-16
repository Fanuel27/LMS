const prisma = require('../config/db');
const { hashPassword } = require('../utils/passwordUtils');

/**
 * Get all users by role with pagination and search
 */
const getUsersByRole = async ({ role, page = 1, limit = 10, search = '' }) => {
  const skip = (page - 1) * limit;

  const where = {
    role,
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};

/**
 * Get a single user by ID (no password)
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
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

/**
 * Create a new user (Admin only)
 */
const createUser = async ({ fullName, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 409, message: 'A user with this email already exists.' };
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { fullName, email, password: hashed, role },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Update user fields (Admin)
 */
const updateUser = async (id, data) => {
  // Check email uniqueness if changing
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (existing) {
      throw { statusCode: 409, message: 'This email is already in use.' };
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Delete a user (Admin only)
 */
const deleteUser = async (id) => {
  await prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw { statusCode: 404, message: 'User not found.' };
  });
  await prisma.user.delete({ where: { id } });
};

/**
 * Reset a user's password (Admin)
 * Returns the new plain-text password to show once in the UI
 */
const resetUserPassword = async (id, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { statusCode: 404, message: 'User not found.' };

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
};

/**
 * Change own password (any authenticated user)
 */
const changeOwnPassword = async (id, newPassword) => {
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
};

/**
 * Get platform stats (Admin dashboard)
 */
const getPlatformStats = async () => {
  const [students, teachers, subjects, questions, notes, mockExams] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.subject.count(),
    prisma.question.count(),
    prisma.note.count(),
    prisma.mockExam.count(),
  ]);

  return { students, teachers, subjects, questions, notes, mockExams };
};

module.exports = {
  getUsersByRole,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  changeOwnPassword,
  getPlatformStats,
};
