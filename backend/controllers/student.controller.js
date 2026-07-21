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

// ─── POST /api/student/practice/start ───────────────────────────────────────
exports.startPracticeSession = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { subjectId, limit = 10, random = 'true' } = req.body;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'subjectId is required.' });
    }

    const takeLimit = parseInt(limit, 10);
    const mode = random === 'true' ? 'Random' : 'Sequential';

    let questions = [];

    if (random === 'true') {
      const allIds = await prisma.question.findMany({
        where: { subjectId },
        select: { id: true }
      });
      
      const shuffledIds = allIds.sort(() => 0.5 - Math.random()).slice(0, takeLimit).map(q => q.id);
      
      if (shuffledIds.length > 0) {
        questions = await prisma.question.findMany({
          where: { id: { in: shuffledIds } },
          select: {
            id: true, question: true, optionA: true, optionB: true, optionC: true, optionD: true,
            subject: { select: { name: true } }
          }
        });
        questions = questions.sort(() => 0.5 - Math.random());
      }
    } else {
      questions = await prisma.question.findMany({
        where: { subjectId },
        take: takeLimit,
        orderBy: [{ createdAt: 'asc' }, { question: 'asc' }],
        select: {
          id: true, question: true, optionA: true, optionB: true, optionC: true, optionD: true,
          subject: { select: { name: true } }
        }
      });
    }

    const session = await prisma.practiceSession.create({
      data: {
        studentId,
        subjectId,
        mode,
        totalQuestions: questions.length
      }
    });

    return sendSuccess(res, { session, questions }, 'Practice session started.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/student/practice/submit ────────────────────────────────────────
exports.submitPracticeAnswer = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { questionId, selectedAnswer, subjectId, practiceSessionId } = req.body;

    if (!questionId || !selectedAnswer || !subjectId || !practiceSessionId) {
      return res.status(400).json({ success: false, message: 'questionId, subjectId, selectedAnswer, and practiceSessionId are required.' });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isCorrect = question.correctAnswer === selectedAnswer;

    await prisma.practiceAttempt.create({
      data: {
        studentId,
        subjectId,
        questionId,
        practiceSessionId,
        selectedAnswer,
        isCorrect
      }
    });

    return sendSuccess(
      res,
      { correct: isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation },
      'Answer submitted successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/student/practice/session/:id/finish ──────────────────────────
exports.finishPracticeSession = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const session = await prisma.practiceSession.findUnique({
      where: { id }
    });

    if (!session || session.studentId !== studentId) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const attempts = await prisma.practiceAttempt.findMany({
      where: { practiceSessionId: id }
    });

    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const incorrectAnswers = attempts.length - correctAnswers;
    const accuracy = session.totalQuestions > 0 ? (correctAnswers / session.totalQuestions) * 100 : 0;

    await prisma.practiceSession.update({
      where: { id },
      data: {
        correctAnswers,
        incorrectAnswers,
        accuracy: parseFloat(accuracy.toFixed(2)),
        completedAt: new Date()
      }
    });

    return sendSuccess(res, null, 'Session finished successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/practice/sessions ───────────────────────────────────────
exports.getPracticeSessions = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [total, sessions] = await Promise.all([
      prisma.practiceSession.count({ where: { studentId, completedAt: { not: null } } }),
      prisma.practiceSession.findMany({
        where: { studentId, completedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
        include: { subject: { select: { name: true } } }
      })
    ]);

    const formattedSessions = sessions.map(s => {
      const duration = s.completedAt ? Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 1000) : null;
      return { ...s, duration };
    });

    return sendSuccess(res, { sessions: formattedSessions, pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) } }, 'Sessions retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/practice/progress ───────────────────────────────────────
exports.getPracticeProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const attempts = await prisma.practiceAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { name: true } },
        question: { select: { question: true } }
      }
    });

    const totalAttempts = attempts.length;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const incorrectAnswers = totalAttempts - correctAnswers;
    const overallAccuracy = totalAttempts > 0 ? ((correctAnswers / totalAttempts) * 100).toFixed(1) : 0;

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // attempts are ordered desc (newest first). 
    // To calculate current streak, we count correct from the beginning.
    for (let i = 0; i < attempts.length; i++) {
      if (attempts[i].isCorrect) {
        currentStreak++;
      } else {
        break; // streak broken
      }
    }

    // For best streak, we need chronological order (oldest first)
    const chronological = [...attempts].reverse();
    for (let i = 0; i < chronological.length; i++) {
      if (chronological[i].isCorrect) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Accuracy by subject
    const subjectStats = {};
    attempts.forEach(a => {
      const sName = a.subject.name;
      if (!subjectStats[sName]) subjectStats[sName] = { total: 0, correct: 0 };
      subjectStats[sName].total++;
      if (a.isCorrect) subjectStats[sName].correct++;
    });

    const accuracyBySubject = Object.keys(subjectStats).map(name => {
      const stat = subjectStats[name];
      return {
        subject: name,
        accuracy: ((stat.correct / stat.total) * 100).toFixed(1)
      };
    });

    return sendSuccess(
      res,
      {
        totalAttempts,
        correctAnswers,
        incorrectAnswers,
        overallAccuracy: parseFloat(overallAccuracy),
        currentStreak,
        bestStreak,
        accuracyBySubject,
        recentHistory: attempts.slice(0, 10).map(a => ({
          isCorrect: a.isCorrect,
          subject: a.subject.name,
          createdAt: a.createdAt,
          questionSnippet: a.question.question.substring(0, 50) + '...'
        }))
      },
      'Practice progress retrieved.'
    );
  } catch (err) {
    next(err);
  }
};
