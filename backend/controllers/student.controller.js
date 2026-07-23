const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');
const notificationService = require('../services/notification.service');
const auditLogService = require('../services/auditLog.service');

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
        totalMockExamsTaken: uniqueExamsTaken,
        averageMockExamScore: parseFloat(avgScore.toFixed(2)),
        highestMockExamScore: parseFloat(bestScore.toFixed(2)),
        lastMockExamDate: attempts.length > 0 ? Math.max(...attempts.map(a => new Date(a.startedAt).getTime())) : null,
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

    auditLogService.log({
      userId: studentId,
      action: 'START_PRACTICE',
      entityType: 'PracticeSession',
      entityId: session.id,
      description: `Started ${mode.toLowerCase()} practice session`,
      req
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

    await notificationService.notifyUser(
      studentId,
      'Practice Session Completed',
      `You completed a practice session with an accuracy of ${accuracy.toFixed(2)}%.`,
      'INFO'
    );

    auditLogService.log({
      userId: studentId,
      action: 'FINISH_PRACTICE',
      entityType: 'PracticeSession',
      entityId: id,
      description: `Finished practice session with ${accuracy.toFixed(2)}% accuracy`,
      req
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

// ─── GET /api/student/mock-exams ──────────────────────────────────────────────
exports.getMockExams = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', subjectId } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { isActive: true };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    const [total, exams] = await Promise.all([
      prisma.mockExam.count({ where }),
      prisma.mockExam.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { fullName: true } }
        }
      })
    ]);

    return sendSuccess(res, { exams, pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) } }, 'Exams retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/mock-exams/:id ──────────────────────────────────────────
exports.getMockExamDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const exam = await prisma.mockExam.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
        questions: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true
                // Explicitly excluding correctAnswer and explanation
              }
            }
          }
        }
      }
    });

    if (!exam || !exam.isActive) {
      return res.status(404).json({ success: false, message: 'Exam not found or inactive.' });
    }

    const formattedExam = {
      ...exam,
      questions: exam.questions.map(q => q.question)
    };

    return sendSuccess(res, formattedExam, 'Exam details retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/student/mock-exams/:id/start ───────────────────────────────────
exports.startMockExam = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id: mockExamId } = req.params;

    const exam = await prisma.mockExam.findUnique({ where: { id: mockExamId } });
    if (!exam || !exam.isActive) {
      return res.status(404).json({ success: false, message: 'Exam not available.' });
    }

    // Check for an already in-progress attempt that hasn't been submitted
    const existingAttempt = await prisma.attempt.findFirst({
      where: { studentId, mockExamId, submittedAt: null }
    });

    if (existingAttempt) {
      return res.status(400).json({ success: false, message: 'You already have an active attempt for this exam.' });
    }

    const attempt = await prisma.attempt.create({
      data: {
        studentId,
        mockExamId,
        score: 0,
        correctAnswers: 0,
        totalQuestions: exam.numberOfQuestions
      }
    });

    auditLogService.log({
      userId: studentId,
      action: 'START_MOCK_EXAM',
      entityType: 'Attempt',
      entityId: attempt.id,
      description: `Started mock exam: ${exam.title}`,
      req
    });

    return sendSuccess(res, { attemptId: attempt.id, startedAt: attempt.startedAt }, 'Exam started successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/student/mock-exams/:id/submit ──────────────────────────────────
exports.submitMockExam = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id: mockExamId } = req.params;
    const { attemptId, answers } = req.body; // answers: { [questionId]: "A" | "B" | "C" | "D" }

    if (!attemptId || !answers) {
      return res.status(400).json({ success: false, message: 'attemptId and answers are required.' });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { mockExam: { include: { questions: { include: { question: true } } } } }
    });

    if (!attempt || attempt.studentId !== studentId || attempt.mockExamId !== mockExamId) {
      return res.status(404).json({ success: false, message: 'Attempt not found or invalid.' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ success: false, message: 'This attempt has already been submitted.' });
    }

    const exam = attempt.mockExam;
    const questions = exam.questions.map(q => q.question);
    
    let correctCount = 0;
    const attemptAnswersData = [];

    for (const q of questions) {
      const selectedOption = answers[q.id] || null;
      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) correctCount++;

      attemptAnswersData.push({
        attemptId,
        questionId: q.id,
        selectedAnswer: selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect
      });
    }

    await prisma.attemptAnswer.createMany({
      data: attemptAnswersData
    });

    const percentage = (correctCount / exam.numberOfQuestions) * 100;
    const passed = percentage >= exam.passingScore;
    const submittedAt = new Date();
    const durationTaken = Math.round((submittedAt - new Date(attempt.startedAt)) / 1000);

    const updatedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: parseFloat(percentage.toFixed(2)),
        correctAnswers: correctCount,
        submittedAt,
        durationTaken
      }
    });

    await notificationService.notifyUser(
      studentId,
      passed ? 'Mock Exam Passed 🎉' : 'Mock Exam Completed',
      `You scored ${percentage.toFixed(2)}% on "${exam.title}". ${passed ? 'Great job!' : 'Keep practicing!'}`,
      passed ? 'SUCCESS' : 'INFO'
    );

    auditLogService.log({
      userId: studentId,
      action: 'SUBMIT_MOCK_EXAM',
      entityType: 'Attempt',
      entityId: attemptId,
      description: `Submitted mock exam "${exam.title}" with score ${percentage.toFixed(2)}%`,
      req
    });

    return sendSuccess(res, {
      score: updatedAttempt.score,
      correctAnswers: correctCount,
      totalQuestions: exam.numberOfQuestions,
      percentage: updatedAttempt.score,
      passed,
      durationTaken
    }, 'Exam submitted successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/mock-exams/history ──────────────────────────────────────
exports.getMockExamHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { studentId, submittedAt: { not: null } };

    const [total, attempts] = await Promise.all([
      prisma.attempt.count({ where }),
      prisma.attempt.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { submittedAt: 'desc' },
        include: {
          mockExam: {
            select: { title: true, passingScore: true, durationMinutes: true, subject: { select: { name: true } } }
          }
        }
      })
    ]);

    const formattedHistory = attempts.map(a => {
      const passed = a.score >= a.mockExam.passingScore;
      return {
        id: a.id,
        examTitle: a.mockExam.title,
        subject: a.mockExam.subject.name,
        date: a.submittedAt,
        duration: a.durationTaken,
        score: a.score,
        percentage: a.score,
        pass: passed
      };
    });

    return sendSuccess(res, { history: formattedHistory, pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) } }, 'History retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/mock-exams/history/:attemptId ───────────────────────────
exports.getMockExamHistoryDetails = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        mockExam: {
          select: { title: true, passingScore: true, durationMinutes: true, subject: { select: { name: true } } }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt || attempt.studentId !== studentId) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ success: false, message: 'This attempt is not yet completed.' });
    }

    const passed = attempt.score >= attempt.mockExam.passingScore;
    
    return sendSuccess(res, { attempt, passed }, 'Attempt review retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/progress ────────────────────────────────────────────────
exports.getProgressOverview = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Fetch practice stats
    const practiceAttempts = await prisma.practiceAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });
    const totalPracticeQuestions = practiceAttempts.length;
    const practiceCorrect = practiceAttempts.filter(a => a.isCorrect).length;
    const overallPracticeAccuracy = totalPracticeQuestions > 0 ? (practiceCorrect / totalPracticeQuestions) * 100 : 0;

    let currentPracticeStreak = 0;
    for (let i = 0; i < practiceAttempts.length; i++) {
      if (practiceAttempts[i].isCorrect) currentPracticeStreak++;
      else break;
    }

    let bestPracticeStreak = 0;
    let tempStreak = 0;
    const chronologicalPractice = [...practiceAttempts].reverse();
    for (let i = 0; i < chronologicalPractice.length; i++) {
      if (chronologicalPractice[i].isCorrect) {
        tempStreak++;
        if (tempStreak > bestPracticeStreak) bestPracticeStreak = tempStreak;
      } else tempStreak = 0;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const practiceThisWeek = practiceAttempts.filter(a => new Date(a.createdAt) >= oneWeekAgo).length;

    // Fetch mock exam stats
    const mockAttempts = await prisma.attempt.findMany({
      where: { studentId, submittedAt: { not: null } }
    });
    const totalMockExamsTaken = mockAttempts.length;
    const overallMockAverage = totalMockExamsTaken > 0 ? mockAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalMockExamsTaken : 0;
    const highestMockScore = totalMockExamsTaken > 0 ? Math.max(...mockAttempts.map(a => a.score)) : 0;
    const lowestMockScore = totalMockExamsTaken > 0 ? Math.min(...mockAttempts.map(a => a.score)) : 0;
    const averageTimePerMock = totalMockExamsTaken > 0 ? mockAttempts.reduce((acc, curr) => acc + (curr.durationTaken || 0), 0) / totalMockExamsTaken : 0;

    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const mocksThisMonth = mockAttempts.filter(a => new Date(a.submittedAt) >= oneMonthAgo).length;

    const overallLearningProgress = (overallPracticeAccuracy + overallMockAverage) / 2;

    return sendSuccess(res, {
      overallPracticeAccuracy: parseFloat(overallPracticeAccuracy.toFixed(1)),
      overallMockAverage: parseFloat(overallMockAverage.toFixed(1)),
      totalPracticeQuestions,
      totalMockExamsTaken,
      currentPracticeStreak,
      bestPracticeStreak,
      highestMockScore,
      lowestMockScore,
      averageTimePerMock: Math.round(averageTimePerMock),
      practiceQuestionsThisWeek: practiceThisWeek,
      mockExamsThisMonth: mocksThisMonth,
      overallLearningProgress: parseFloat(overallLearningProgress.toFixed(1))
    }, 'Overview retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/progress/practice ───────────────────────────────────────
exports.getProgressPracticeHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, sessions] = await Promise.all([
      prisma.practiceSession.count({ where: { studentId, completedAt: { not: null } } }),
      prisma.practiceSession.findMany({
        where: { studentId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limitNum,
        include: { subject: { select: { name: true } } }
      })
    ]);

    const history = sessions.map(s => ({
      sessionId: s.id,
      subject: s.subject.name,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      questionsAnswered: s.totalQuestions,
      correct: s.correctAnswers,
      incorrect: s.incorrectAnswers,
      accuracy: s.accuracy,
      duration: s.completedAt ? Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 1000) : 0
    }));

    return sendSuccess(res, { history, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } }, 'Practice history retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/progress/mock-exams ─────────────────────────────────────
exports.getProgressMockHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, attempts] = await Promise.all([
      prisma.attempt.count({ where: { studentId, submittedAt: { not: null } } }),
      prisma.attempt.findMany({
        where: { studentId, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limitNum,
        include: { mockExam: { select: { title: true, passingScore: true, subject: { select: { name: true } } } } }
      })
    ]);

    const history = attempts.map(a => ({
      attemptId: a.id,
      examTitle: a.mockExam.title,
      subject: a.mockExam.subject.name,
      score: a.score,
      percentage: a.score,
      passingScore: a.mockExam.passingScore,
      passed: a.score >= a.mockExam.passingScore,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      duration: a.durationTaken
    }));

    return sendSuccess(res, { history, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } }, 'Mock exam history retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/progress/subjects ───────────────────────────────────────
exports.getProgressSubjects = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const subjects = await prisma.subject.findMany({ select: { id: true, name: true } });
    
    const [practiceAttempts, mockAttempts] = await Promise.all([
      prisma.practiceAttempt.findMany({ where: { studentId } }),
      prisma.attempt.findMany({ where: { studentId, submittedAt: { not: null } }, include: { mockExam: true } })
    ]);

    const analytics = subjects.map(sub => {
      const pAttempts = practiceAttempts.filter(a => a.subjectId === sub.id);
      const pCorrect = pAttempts.filter(a => a.isCorrect).length;
      const practiceAccuracy = pAttempts.length > 0 ? (pCorrect / pAttempts.length) * 100 : 0;
      
      const mAttempts = mockAttempts.filter(a => a.mockExam.subjectId === sub.id);
      const mScoreSum = mAttempts.reduce((acc, curr) => acc + curr.score, 0);
      const mockAverage = mAttempts.length > 0 ? mScoreSum / mAttempts.length : 0;
      const bestScore = mAttempts.length > 0 ? Math.max(...mAttempts.map(a => a.score)) : 0;
      const worstScore = mAttempts.length > 0 ? Math.min(...mAttempts.map(a => a.score)) : 0;

      const pLast = pAttempts.length > 0 ? Math.max(...pAttempts.map(a => new Date(a.createdAt).getTime())) : 0;
      const mLast = mAttempts.length > 0 ? Math.max(...mAttempts.map(a => new Date(a.submittedAt).getTime())) : 0;
      const lastActivity = Math.max(pLast, mLast);

      return {
        subjectName: sub.name,
        practiceAttempts: pAttempts.length,
        practiceAccuracy: parseFloat(practiceAccuracy.toFixed(1)),
        mockExamsTaken: mAttempts.length,
        mockAverage: parseFloat(mockAverage.toFixed(1)),
        bestScore,
        worstScore,
        lastActivity: lastActivity > 0 ? new Date(lastActivity) : null
      };
    }).filter(a => a.practiceAttempts > 0 || a.mockExamsTaken > 0);

    return sendSuccess(res, analytics, 'Subject analytics retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/progress/activity ───────────────────────────────────────
exports.getProgressActivity = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [practiceSessions, mockAttempts] = await Promise.all([
      prisma.practiceSession.findMany({
        where: { studentId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 20,
        include: { subject: { select: { name: true } } }
      }),
      prisma.attempt.findMany({
        where: { studentId, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        take: 20,
        include: { mockExam: { select: { title: true, subject: { select: { name: true } } } } }
      })
    ]);

    let activities = [];

    practiceSessions.forEach(p => {
      activities.push({
        id: `p-${p.id}`,
        type: 'PRACTICE',
        subject: p.subject.name,
        title: `${p.mode} Practice`,
        score: p.accuracy,
        date: p.completedAt
      });
    });

    mockAttempts.forEach(m => {
      activities.push({
        id: `m-${m.id}`,
        type: 'MOCK_EXAM',
        subject: m.mockExam.subject.name,
        title: m.mockExam.title,
        score: m.score,
        date: m.submittedAt
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    activities = activities.slice(0, 20);

    return sendSuccess(res, activities, 'Recent activity retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/profile ────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        fullName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch stats to include in profile
    const practiceAttempts = await prisma.practiceAttempt.findMany({
      where: { studentId },
    });
    const totalPracticeQuestions = practiceAttempts.length;
    const practiceCorrect = practiceAttempts.filter(a => a.isCorrect).length;
    const overallPracticeAccuracy = totalPracticeQuestions > 0 ? (practiceCorrect / totalPracticeQuestions) * 100 : 0;

    const mockAttempts = await prisma.attempt.findMany({
      where: { studentId, submittedAt: { not: null } },
    });
    const mockExamsTaken = mockAttempts.length;
    const averageMockScore = mockExamsTaken > 0 ? mockAttempts.reduce((acc, curr) => acc + curr.score, 0) / mockExamsTaken : 0;
    const bestMockScore = mockExamsTaken > 0 ? Math.max(...mockAttempts.map(a => a.score)) : 0;

    const profileData = {
      ...user,
      stats: {
        totalPracticeQuestions,
        overallPracticeAccuracy: parseFloat(overallPracticeAccuracy.toFixed(1)),
        mockExamsTaken,
        averageMockScore: parseFloat(averageMockScore.toFixed(1)),
        bestMockScore
      }
    };

    return sendSuccess(res, profileData, 'Profile retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/student/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { fullName } = req.body;

    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { fullName: fullName.trim() },
      select: { fullName: true, email: true, role: true, createdAt: true }
    });

    return sendSuccess(res, updatedUser, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/student/change-password ─────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: studentId },
      data: { password: hashedPassword }
    });

    return sendSuccess(res, null, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/student/leaderboard ─────────────────────────────────────────────
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all students
    let usersQuery = { role: 'STUDENT', isActive: true };
    if (search) {
      usersQuery.fullName = { contains: search, mode: 'insensitive' };
    }

    const students = await prisma.user.findMany({
      where: usersQuery,
      select: { id: true, fullName: true }
    });

    const studentIds = students.map(s => s.id);
    
    const [mockAttempts, practiceAttempts] = await Promise.all([
      prisma.attempt.findMany({
        where: { studentId: { in: studentIds }, submittedAt: { not: null } },
        select: { studentId: true, score: true }
      }),
      prisma.practiceAttempt.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, isCorrect: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const mockMap = {};
    mockAttempts.forEach(m => {
      if (!mockMap[m.studentId]) mockMap[m.studentId] = [];
      mockMap[m.studentId].push(m.score);
    });

    const practiceMap = {};
    practiceAttempts.forEach(p => {
      if (!practiceMap[p.studentId]) practiceMap[p.studentId] = [];
      practiceMap[p.studentId].push(p);
    });

    let leaderboard = students.map(student => {
      const mocks = mockMap[student.id] || [];
      const mockExamsTaken = mocks.length;
      const averageMockScore = mockExamsTaken > 0 ? mocks.reduce((a, b) => a + b, 0) / mockExamsTaken : 0;

      const practices = practiceMap[student.id] || [];
      const totalPracticeQuestions = practices.length;
      const correctPractice = practices.filter(p => p.isCorrect).length;
      const practiceAccuracy = totalPracticeQuestions > 0 ? (correctPractice / totalPracticeQuestions) * 100 : 0;

      let bestStreak = 0;
      let tempStreak = 0;
      const chronologicalPractice = [...practices].reverse();
      for (let i = 0; i < chronologicalPractice.length; i++) {
        if (chronologicalPractice[i].isCorrect) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else tempStreak = 0;
      }

      return {
        studentId: student.id,
        fullName: student.fullName,
        averageMockScore: parseFloat(averageMockScore.toFixed(1)),
        practiceAccuracy: parseFloat(practiceAccuracy.toFixed(1)),
        bestStreak,
        mockExamsTaken,
        totalPracticeQuestions
      };
    });

    // Ranking priority:
    // 1. Highest average mock score
    // 2. Highest practice accuracy
    // 3. Highest best streak
    leaderboard.sort((a, b) => {
      if (b.averageMockScore !== a.averageMockScore) return b.averageMockScore - a.averageMockScore;
      if (b.practiceAccuracy !== a.practiceAccuracy) return b.practiceAccuracy - a.practiceAccuracy;
      return b.bestStreak - a.bestStreak;
    });

    // Assign ranks
    leaderboard = leaderboard.map((l, idx) => ({ ...l, rank: idx + 1 }));
    
    // Privacy: remove studentId, add isMe
    const loggedInStudentId = req.user.id;
    leaderboard = leaderboard.map(l => {
      const isMe = l.studentId === loggedInStudentId;
      const { studentId, ...rest } = l;
      return { ...rest, isMe };
    });

    // Pagination
    const total = leaderboard.length;
    const paginated = leaderboard.slice(skip, skip + limitNum);

    return sendSuccess(res, {
      leaderboard: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Leaderboard retrieved successfully.');

  } catch (err) {
    next(err);
  }
};
