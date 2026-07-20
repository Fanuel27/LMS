const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');

// ─── GET /api/student/stats ───────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Practice Attempts (total attempts by student)
    const practiceAttemptsCount = await prisma.attempt.count({
      where: { studentId },
    });

    // 2. Mock Exams Taken (distinct mock exams attempted by student)
    const attempts = await prisma.attempt.findMany({
      where: { studentId },
      select: { mockExamId: true, score: true, startedAt: true },
    });
    const uniqueExamsTaken = new Set(attempts.map((a) => a.mockExamId)).size;

    // 3. Average & Best Score
    let avgScore = 0;
    let bestScore = 0;
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
      avgScore = totalScore / attempts.length;
      bestScore = Math.max(...attempts.map((a) => a.score));
    }

    // 4. Notes Available
    const notesAvailable = await prisma.note.count();

    // 5. Subjects Available
    const subjectsAvailable = await prisma.subject.count();

    // 6. Available Mock Exams (Active only)
    const availableMockExams = await prisma.mockExam.count({
      where: { isActive: true },
    });

    // 7. Recent Activity (last 5 attempts)
    const recentActivity = await prisma.attempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        mockExam: {
          select: { title: true, subject: { select: { name: true } } }
        }
      }
    });

    return sendSuccess(
      res,
      {
        practiceAttempts: practiceAttemptsCount,
        mockExamsTaken: uniqueExamsTaken,
        avgScore: parseFloat(avgScore.toFixed(2)),
        bestScore: parseFloat(bestScore.toFixed(2)),
        notesAvailable,
        availableMockExams,
        subjectsAvailable,
        recentActivity,
      },
      'Student stats retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/subjects ────────────────────────────────────────────────
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            notes: true,
          }
        },
        // Using include to get mock exams is fine, but we need to filter by active
        // Let's use a nested where for the count, or we can fetch them and filter
        mockExams: {
          where: { isActive: true },
          select: { id: true },
        }
      },
    });

    // Map to count mock exams correctly
    const formattedSubjects = subjects.map(sub => ({
      id: sub.id,
      name: sub.name,
      category: sub.category,
      _count: {
        notes: sub._count.notes,
        mockExams: sub.mockExams.length,
      }
    }));

    return sendSuccess(res, formattedSubjects, 'Subjects retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/notes ───────────────────────────────────────────────────
exports.getNotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', subjectId, sort = 'desc' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    const orderBy = { createdAt: sort === 'asc' ? 'asc' : 'desc' };

    const [total, notes] = await Promise.all([
      prisma.note.count({ where }),
      prisma.note.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        include: {
          subject: { select: { name: true, category: true } },
          uploadedBy: { select: { fullName: true } }
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(
      res,
      {
        notes,
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages },
      },
      'Notes retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/notes/:id/download ──────────────────────────────────────
exports.downloadNotePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const path = require('path');
    const fs = require('fs');

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const filePath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', note.pdfFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    return res.download(filePath, `${note.title}.pdf`);
  } catch (err) {
    next(err);
  }
};
