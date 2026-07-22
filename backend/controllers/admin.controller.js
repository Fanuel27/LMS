const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');

exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalQuestions,
      totalNotes,
      totalMockExams,
      activeMockExams,
      practiceAttempts,
      mockExamAttempts,
      announcements,
      notificationsSent
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.subject.count(),
      prisma.question.count(),
      prisma.note.count(),
      prisma.mockExam.count(),
      prisma.mockExam.count({ where: { isActive: true } }),
      prisma.practiceAttempt.count(),
      prisma.attempt.count(),
      prisma.notification.count({ where: { userId: null } }),
      prisma.notification.count({ where: { userId: { not: null } } })
    ]);

    return sendSuccess(res, {
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalQuestions,
      totalNotes,
      totalMockExams,
      activeMockExams,
      practiceAttempts,
      mockExamAttempts,
      announcements,
      notificationsSent
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsersAnalytics = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { createdAt: true, role: true, isActive: true } });
    
    const usersByMonthMap = {};
    users.forEach(u => {
      const month = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`;
      usersByMonthMap[month] = (usersByMonthMap[month] || 0) + 1;
    });
    const usersByMonth = Object.entries(usersByMonthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const activeUsers = users.filter(u => u.isActive).length;
    const disabledUsers = users.filter(u => !u.isActive).length;
    const studentCount = users.filter(u => u.role === 'STUDENT').length;
    const teacherCount = users.filter(u => u.role === 'TEACHER').length;

    return sendSuccess(res, {
      usersByMonth,
      activeUsers,
      disabledUsers,
      distribution: [
        { name: 'Students', value: studentCount },
        { name: 'Teachers', value: teacherCount }
      ]
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubjectsAnalytics = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            questions: true,
            notes: true,
            practiceAttempts: true,
          }
        },
        mockExams: {
          select: {
            _count: { select: { attempts: true } }
          }
        },
        practiceSessions: {
          select: { accuracy: true }
        }
      }
    });

    const mockExamsWithAttempts = await prisma.mockExam.findMany({
      select: {
        subjectId: true,
        attempts: { select: { score: true } }
      }
    });

    const mockScoresBySubject = {};
    mockExamsWithAttempts.forEach(exam => {
      if (!mockScoresBySubject[exam.subjectId]) {
        mockScoresBySubject[exam.subjectId] = { total: 0, count: 0 };
      }
      exam.attempts.forEach(attempt => {
        mockScoresBySubject[exam.subjectId].total += attempt.score;
        mockScoresBySubject[exam.subjectId].count += 1;
      });
    });

    const data = subjects.map(s => {
      const practiceSessions = s.practiceSessions || [];
      const avgPracticeAccuracy = practiceSessions.length > 0 
        ? practiceSessions.reduce((acc, curr) => acc + curr.accuracy, 0) / practiceSessions.length 
        : 0;

      const mockStats = mockScoresBySubject[s.id];
      const avgMockScore = mockStats && mockStats.count > 0 ? mockStats.total / mockStats.count : 0;
      const mockAttempts = s.mockExams.reduce((acc, exam) => acc + exam._count.attempts, 0);

      return {
        id: s.id,
        name: s.name,
        questionCount: s._count.questions,
        notesCount: s._count.notes,
        practiceAttempts: s._count.practiceAttempts,
        mockAttempts,
        averagePracticeAccuracy: Math.round(avgPracticeAccuracy * 10) / 10,
        averageMockScore: Math.round(avgMockScore * 10) / 10
      };
    });

    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getActivityFeed = async (req, res, next) => {
  try {
    const [users, notes, questions, mockExams, practiceSessions, mockAttempts, announcements] = await Promise.all([
      prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, role: true, createdAt: true } }),
      prisma.note.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true, uploadedBy: { select: { fullName: true } } } }),
      prisma.question.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, question: true, createdAt: true, teacher: { select: { fullName: true } } } }),
      prisma.mockExam.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true, teacher: { select: { fullName: true } } } }),
      prisma.practiceSession.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, createdAt: true, student: { select: { fullName: true } }, subject: { select: { name: true } } } }),
      prisma.attempt.findMany({ take: 10, orderBy: { startedAt: 'desc' }, select: { id: true, startedAt: true, student: { select: { fullName: true } }, mockExam: { select: { title: true } } } }),
      prisma.notification.findMany({ where: { userId: null }, take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true } }),
    ]);

    const feed = [
      ...users.map(u => ({ id: `u-${u.id}`, type: 'USER_REGISTERED', title: `New ${u.role.toLowerCase()} registered: ${u.fullName}`, timestamp: u.createdAt })),
      ...notes.map(n => ({ id: `n-${n.id}`, type: 'NOTE_UPLOADED', title: `Note uploaded: ${n.title} by ${n.uploadedBy?.fullName}`, timestamp: n.createdAt })),
      ...questions.map(q => ({ id: `q-${q.id}`, type: 'QUESTION_CREATED', title: `Question created by ${q.teacher?.fullName}`, timestamp: q.createdAt })),
      ...mockExams.map(m => ({ id: `m-${m.id}`, type: 'MOCK_CREATED', title: `Mock exam created: ${m.title} by ${m.teacher?.fullName}`, timestamp: m.createdAt })),
      ...practiceSessions.map(p => ({ id: `p-${p.id}`, type: 'PRACTICE_COMPLETED', title: `${p.student?.fullName} completed practice for ${p.subject?.name}`, timestamp: p.createdAt })),
      ...mockAttempts.map(a => ({ id: `a-${a.id}`, type: 'MOCK_ATTEMPTED', title: `${a.student?.fullName} completed mock exam: ${a.mockExam?.title}`, timestamp: a.startedAt })),
      ...announcements.map(a => ({ id: `an-${a.id}`, type: 'ANNOUNCEMENT_PUBLISHED', title: `Announcement: ${a.title}`, timestamp: a.createdAt })),
    ];

    feed.sort((a, b) => b.timestamp - a.timestamp);
    return sendSuccess(res, feed.slice(0, 30));
  } catch (err) {
    next(err);
  }
};

exports.getPerformanceAnalytics = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        fullName: true,
        attempts: { select: { score: true } },
        practiceSessions: { select: { accuracy: true } }
      }
    });

    const topStudents = students.map(s => {
      const avgMock = s.attempts.length > 0 ? s.attempts.reduce((acc, curr) => acc + curr.score, 0) / s.attempts.length : 0;
      const avgPractice = s.practiceSessions.length > 0 ? s.practiceSessions.reduce((acc, curr) => acc + curr.accuracy, 0) / s.practiceSessions.length : 0;
      return { id: s.id, name: s.fullName, mockAverage: Math.round(avgMock * 10)/10, practiceAccuracy: Math.round(avgPractice * 10)/10 };
    }).sort((a, b) => b.mockAverage - a.mockAverage).slice(0, 10);

    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: { questionsCreated: true, notesCreated: true, mockExamsCreated: true }
        }
      }
    });

    const teacherActivity = teachers.map(t => ({
      id: t.id,
      name: t.fullName,
      questionsCreated: t._count.questionsCreated,
      notesUploaded: t._count.notesCreated,
      mockExamsCreated: t._count.mockExamsCreated,
      totalActivity: t._count.questionsCreated + t._count.notesCreated + t._count.mockExamsCreated
    })).sort((a, b) => b.totalActivity - a.totalActivity).slice(0, 10);

    const subjectStats = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { practiceAttempts: true } },
        mockExams: { select: { _count: { select: { attempts: true } }, attempts: { select: { score: true } } } },
        practiceSessions: { select: { accuracy: true } }
      }
    });

    const subjectMetrics = subjectStats.map(s => {
      const mockAttemptsCount = s.mockExams.reduce((acc, exam) => acc + exam._count.attempts, 0);
      const totalAttempts = s._count.practiceAttempts + mockAttemptsCount;
      
      let totalMockScore = 0;
      let totalMockAttempts = 0;
      s.mockExams.forEach(exam => {
        exam.attempts.forEach(attempt => {
          totalMockScore += attempt.score;
          totalMockAttempts++;
        });
      });
      const avgMockScore = totalMockAttempts > 0 ? totalMockScore / totalMockAttempts : 0;
      
      const avgPractice = s.practiceSessions.length > 0 
        ? s.practiceSessions.reduce((acc, curr) => acc + curr.accuracy, 0) / s.practiceSessions.length 
        : 0;

      let difficultyScore = 0;
      if (avgMockScore > 0 && avgPractice > 0) difficultyScore = (avgMockScore + avgPractice) / 2;
      else if (avgMockScore > 0) difficultyScore = avgMockScore;
      else if (avgPractice > 0) difficultyScore = avgPractice;
      else difficultyScore = 100;

      return {
        id: s.id,
        name: s.name,
        totalAttempts,
        avgMockScore: Math.round(avgMockScore * 10) / 10,
        avgPractice: Math.round(avgPractice * 10) / 10,
        difficultyScore
      };
    });

    const mostAttemptedSubjects = [...subjectMetrics].sort((a, b) => b.totalAttempts - a.totalAttempts).slice(0, 5);
    const hardestSubjects = [...subjectMetrics].filter(s => s.difficultyScore < 100 && s.totalAttempts > 0).sort((a, b) => a.difficultyScore - b.difficultyScore).slice(0, 5);
    const easiestSubjects = [...subjectMetrics].filter(s => s.difficultyScore < 100 && s.totalAttempts > 0).sort((a, b) => b.difficultyScore - a.difficultyScore).slice(0, 5);

    return sendSuccess(res, {
      topStudents,
      teacherActivity,
      mostAttemptedSubjects,
      hardestSubjects,
      easiestSubjects
    });

  } catch (err) {
    next(err);
  }
};
