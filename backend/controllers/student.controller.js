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
