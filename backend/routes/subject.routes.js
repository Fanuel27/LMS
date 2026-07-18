const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { sendSuccess, sendError } = require('../utils/response');

const teacherOrAdmin = [authenticate, requireRole('ADMIN', 'TEACHER')];
const teacherOnly = [authenticate, requireRole('TEACHER')];

// ─── GET /api/subjects ────────────────────────────────────────────────────────
// Returns all subjects, optionally filtered by category
// Accessible by TEACHER and ADMIN
router.get('/', ...teacherOrAdmin, async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = category ? { category: category.toUpperCase() } : {};

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            notes: true,
            mockExams: true,
          },
        },
      },
    });

    return sendSuccess(res, subjects, 'Subjects retrieved.');
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/teacher/stats ───────────────────────────────────────────────────
// Returns personal stats for the logged-in teacher
router.get('/teacher/stats', ...teacherOnly, async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const [questions, notes, mockExams, attempts] = await Promise.all([
      prisma.question.count({ where: { teacherId } }),
      prisma.note.count({ where: { teacherId } }),
      prisma.mockExam.count({ where: { teacherId } }),
      prisma.attempt.findMany({
        where: {
          mockExam: { teacherId },
        },
        select: { score: true, studentId: true },
      }),
    ]);

    // Compute derived stats
    const studentIds = [...new Set(attempts.map((a) => a.studentId))];
    const studentsCount = studentIds.length;
    const avgScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : null;

    return sendSuccess(
      res,
      {
        questions,
        notes,
        mockExams,
        avgScore,
        studentsPracticing: studentsCount,
        totalAttempts: attempts.length,
      },
      'Teacher stats retrieved.'
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
