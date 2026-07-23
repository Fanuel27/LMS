const prisma = require('../config/db');

// Helper to convert array of objects to CSV
const jsonToCsv = (data) => {
  if (!data || !data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

const getBackupData = async () => {
  const [
    users, subjects, questions, notes, mockExams, 
    mockExamQuestions, attempts, attemptAnswers, 
    practiceSessions, practiceAttempts, notifications, 
    systemSettings, auditLogs
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, fullName: true, email: true, role: true, 
        isActive: true, createdAt: true, updatedAt: true
      }
    }),
    prisma.subject.findMany(),
    prisma.question.findMany(),
    prisma.note.findMany(),
    prisma.mockExam.findMany(),
    prisma.mockExamQuestion.findMany(),
    prisma.attempt.findMany(),
    prisma.attemptAnswer.findMany(),
    prisma.practiceSession.findMany(),
    prisma.practiceAttempt.findMany(),
    prisma.notification.findMany(),
    prisma.systemSetting.findMany(),
    prisma.auditLog.findMany()
  ]);

  return {
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      entities: {
        users: users.length,
        subjects: subjects.length,
        questions: questions.length,
        notes: notes.length,
        mockExams: mockExams.length,
        mockExamQuestions: mockExamQuestions.length,
        attempts: attempts.length,
        attemptAnswers: attemptAnswers.length,
        practiceSessions: practiceSessions.length,
        practiceAttempts: practiceAttempts.length,
        notifications: notifications.length,
        systemSettings: systemSettings.length,
        auditLogs: auditLogs.length
      }
    },
    data: {
      users, subjects, questions, notes, mockExams, 
      mockExamQuestions, attempts, attemptAnswers, 
      practiceSessions, practiceAttempts, notifications, 
      systemSettings, auditLogs
    }
  };
};

// ─── Export Functions ────────────────────────────────────────────────────────
exports.exportUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true, fullName: true, email: true, role: true, 
      isActive: true, createdAt: true, updatedAt: true
    }
  });
  return jsonToCsv(users);
};

exports.exportStudents = async () => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true, fullName: true, email: true, 
      isActive: true, createdAt: true, updatedAt: true
    }
  });
  return jsonToCsv(students);
};

exports.exportQuestions = async () => {
  const questions = await prisma.question.findMany({
    include: { subject: { select: { name: true } }, teacher: { select: { fullName: true } } }
  });
  const formatted = questions.map(q => ({
    id: q.id,
    subject: q.subject?.name || '',
    teacher: q.teacher?.fullName || '',
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    createdAt: q.createdAt
  }));
  return jsonToCsv(formatted);
};

exports.exportMockExams = async () => {
  const exams = await prisma.mockExam.findMany({
    include: { subject: { select: { name: true } }, teacher: { select: { fullName: true } } }
  });
  const formatted = exams.map(e => ({
    id: e.id,
    title: e.title,
    subject: e.subject?.name || '',
    teacher: e.teacher?.fullName || '',
    durationMinutes: e.durationMinutes,
    numberOfQuestions: e.numberOfQuestions,
    passingScore: e.passingScore,
    isActive: e.isActive,
    createdAt: e.createdAt
  }));
  return jsonToCsv(formatted);
};

exports.exportResults = async () => {
  const attempts = await prisma.attempt.findMany({
    include: { student: { select: { fullName: true, email: true } }, mockExam: { select: { title: true } } }
  });
  const formatted = attempts.map(a => ({
    id: a.id,
    studentName: a.student?.fullName || '',
    studentEmail: a.student?.email || '',
    examTitle: a.mockExam?.title || '',
    score: a.score,
    correctAnswers: a.correctAnswers,
    totalQuestions: a.totalQuestions,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    durationTaken: a.durationTaken
  }));
  return jsonToCsv(formatted);
};

exports.exportAuditLogs = async () => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { email: true } } }
  });
  const formatted = logs.map(l => ({
    id: l.id,
    userEmail: l.user?.email || 'SYSTEM',
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId || '',
    description: l.description,
    ipAddress: l.ipAddress || '',
    createdAt: l.createdAt
  }));
  return jsonToCsv(formatted);
};

exports.exportSettings = async () => {
  const settings = await prisma.systemSetting.findMany();
  return jsonToCsv(settings);
};

// ─── Backup & Restore ────────────────────────────────────────────────────────

exports.createBackup = async () => {
  return await getBackupData();
};

exports.validateBackup = (backup) => {
  const errors = [];
  const warnings = [];

  if (!backup) {
    errors.push('Invalid backup: Empty or missing data.');
    return { valid: false, errors, warnings };
  }
  if (!backup.metadata) {
    errors.push('Invalid backup: Missing metadata.');
    return { valid: false, errors, warnings };
  }
  if (!backup.data) {
    errors.push('Invalid backup: Missing data payload.');
    return { valid: false, errors, warnings };
  }

  const { version, entities } = backup.metadata;
  if (!version) errors.push('Missing backup version.');
  if (!entities) errors.push('Missing entities summary in metadata.');

  const requiredCollections = ['users', 'subjects', 'questions', 'notes', 'mockExams'];
  requiredCollections.forEach(col => {
    if (!backup.data[col] || !Array.isArray(backup.data[col])) {
      errors.push(`Invalid backup: Missing "${col}" section.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

exports.restoreBackup = async (backupData, mode = 'MERGE', isDryRun = false) => {
  const validation = exports.validateBackup(backupData);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const data = backupData.data;
  
  const report = {
    recordsRestored: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    details: {
      users: { restored: 0, updated: 0, skipped: 0 },
      subjects: { restored: 0, updated: 0, skipped: 0 },
      questions: { restored: 0, updated: 0, skipped: 0 },
      notes: { restored: 0, updated: 0, skipped: 0 },
      mockExams: { restored: 0, updated: 0, skipped: 0 },
      mockExamQuestions: { restored: 0, updated: 0, skipped: 0 },
      attempts: { restored: 0, updated: 0, skipped: 0 },
      attemptAnswers: { restored: 0, updated: 0, skipped: 0 },
      practiceSessions: { restored: 0, updated: 0, skipped: 0 },
      practiceAttempts: { restored: 0, updated: 0, skipped: 0 },
      notifications: { restored: 0, updated: 0, skipped: 0 },
      systemSettings: { restored: 0, updated: 0, skipped: 0 },
      auditLogs: { restored: 0, updated: 0, skipped: 0 },
    },
    validationWarnings: validation.warnings,
    skippedUsers: [],
    skippedReasons: [],
    errors: [],
  };

  try {
    // Determine the result inside a massive transaction
    await prisma.$transaction(async (tx) => {
      // ─── REPLACE MODE ───
      if (mode === 'REPLACE' && !isDryRun) {
        // Clear everything EXCEPT users
        await tx.auditLog.deleteMany();
        await tx.systemSetting.deleteMany();
        await tx.notification.deleteMany();
        await tx.practiceAttempt.deleteMany();
        await tx.practiceSession.deleteMany();
        await tx.attemptAnswer.deleteMany();
        await tx.attempt.deleteMany();
        await tx.mockExamQuestion.deleteMany();
        await tx.mockExam.deleteMany();
        await tx.note.deleteMany();
        await tx.question.deleteMany();
        await tx.subject.deleteMany();
      }

      // ─── USERS ───
      const existingUsers = await tx.user.findMany({ select: { id: true, email: true } });
      const existingUserMapById = new Map(existingUsers.map(u => [u.id, u]));
      const existingUserMapByEmail = new Map(existingUsers.map(u => [u.email, u]));
      
      const validUserIds = new Set(existingUsers.map(u => u.id));

      if (data.users && !isDryRun) {
        for (const u of data.users) {
          const match = existingUserMapById.get(u.id) || existingUserMapByEmail.get(u.email);
          if (match) {
            // Merge mode for existing users (update non-sensitive)
            await tx.user.update({
              where: { id: match.id },
              data: {
                fullName: u.fullName,
                role: u.role,
                isActive: u.isActive,
              }
            });
            report.recordsUpdated++;
            report.details.users.updated++;
          } else {
            // New user in backup -> skip according to policy
            report.recordsSkipped++;
            report.details.users.skipped++;
            report.skippedUsers.push(u.email);
            report.skippedReasons.push({
               entity: 'User',
               identifier: u.email,
               reason: 'Password is intentionally excluded from backups (security policy).'
            });
            report.validationWarnings.push(`Skipped new user from backup: ${u.email}`);
          }
        }
      }

      // Helper to safely restore other entities, discarding records with invalid user references
      const safeCreateMany = async (model, items, userKeyFields = [], collectionName = model) => {
        if (!items || items.length === 0) return;
        
        let localCollectionName = collectionName;
        // Map model to plural key in details if they match basic rules
        if (report.details[model + 's']) localCollectionName = model + 's';
        if (model === 'mockExam') localCollectionName = 'mockExams';
        if (model === 'systemSetting') localCollectionName = 'systemSettings';
        
        const validItems = items.filter(item => {
          for (const key of userKeyFields) {
            if (item[key] && !validUserIds.has(item[key])) {
              report.recordsSkipped++;
              if (report.details[localCollectionName]) report.details[localCollectionName].skipped++;
              report.skippedReasons.push({
                 entity: model,
                 identifier: item.id || 'Unknown',
                 reason: `Missing valid User ID (${item[key]}).`
              });
              return false; // User doesn't exist, skip this record to prevent FK error
            }
          }
          return true;
        });

        if (validItems.length > 0 && !isDryRun) {
          if (mode === 'REPLACE') {
            await tx[model].createMany({ data: validItems, skipDuplicates: true });
            report.recordsRestored += validItems.length;
            if (report.details[localCollectionName]) report.details[localCollectionName].restored += validItems.length;
          } else {
            // MERGE mode
            const result = await tx[model].createMany({ data: validItems, skipDuplicates: true });
            report.recordsRestored += result.count;
            if (report.details[localCollectionName]) report.details[localCollectionName].restored += result.count;
            
            const skippedByDb = validItems.length - result.count;
            if (skippedByDb > 0) {
              report.recordsSkipped += skippedByDb;
              if (report.details[localCollectionName]) report.details[localCollectionName].skipped += skippedByDb;
              // We don't log a specific reason here because it's a bulk skip by Prisma due to existing IDs
            }
          }
        } else if (validItems.length > 0 && isDryRun) {
           report.recordsRestored += validItems.length;
           if (report.details[localCollectionName]) report.details[localCollectionName].restored += validItems.length;
        }
      };

      // ─── Restore Order (Respecting FKs) ───
      await safeCreateMany('subject', data.subjects);
      
      // We need valid subject IDs for questions
      const existingSubjects = await tx.subject.findMany({ select: { id: true } });
      const validSubjectIds = new Set(existingSubjects.map(s => s.id));

      const filterBySubject = (items, key = 'subjectId', entityName) => {
        return items.filter(item => {
          if (!validSubjectIds.has(item[key])) {
            report.recordsSkipped++;
            if (report.details[entityName]) report.details[entityName].skipped++;
            report.skippedReasons.push({
               entity: entityName,
               identifier: item.id || 'Unknown',
               reason: `Missing valid Subject ID (${item[key]}).`
            });
            return false;
          }
          return true;
        });
      };

      await safeCreateMany('question', filterBySubject(data.questions || [], 'subjectId', 'questions'), ['teacherId']);
      await safeCreateMany('note', filterBySubject(data.notes || [], 'subjectId', 'notes'), ['teacherId']);
      await safeCreateMany('mockExam', filterBySubject(data.mockExams || [], 'subjectId', 'mockExams'), ['teacherId']);
      
      // Need valid questions and exams for relationships
      const existingQuestions = await tx.question.findMany({ select: { id: true } });
      const validQuestionIds = new Set(existingQuestions.map(q => q.id));
      const existingExams = await tx.mockExam.findMany({ select: { id: true } });
      const validExamIds = new Set(existingExams.map(e => e.id));

      const filterExamQuestions = (items) => items.filter(item => {
        if (!validExamIds.has(item.mockExamId) || !validQuestionIds.has(item.questionId)) {
          report.recordsSkipped++; 
          report.details.mockExamQuestions.skipped++;
          report.skippedReasons.push({
             entity: 'mockExamQuestions',
             identifier: item.id || 'Unknown',
             reason: `Missing valid mockExamId or questionId.`
          });
          return false;
        }
        return true;
      });

      await safeCreateMany('mockExamQuestion', filterExamQuestions(data.mockExamQuestions || []));
      
      const filterAttempts = (items) => items.filter(item => {
        if (!validExamIds.has(item.mockExamId)) { 
          report.recordsSkipped++; 
          report.details.attempts.skipped++;
          report.skippedReasons.push({
             entity: 'attempts',
             identifier: item.id || 'Unknown',
             reason: `Missing valid mockExamId.`
          });
          return false; 
        }
        return true;
      });
      await safeCreateMany('attempt', filterAttempts(data.attempts || []), ['studentId']);

      const existingAttempts = await tx.attempt.findMany({ select: { id: true } });
      const validAttemptIds = new Set(existingAttempts.map(a => a.id));

      const filterAttemptAnswers = (items) => items.filter(item => {
        if (!validAttemptIds.has(item.attemptId) || !validQuestionIds.has(item.questionId)) {
          report.recordsSkipped++; 
          report.details.attemptAnswers.skipped++;
          report.skippedReasons.push({
             entity: 'attemptAnswers',
             identifier: item.id || 'Unknown',
             reason: `Missing valid attemptId or questionId.`
          });
          return false;
        }
        return true;
      });
      await safeCreateMany('attemptAnswer', filterAttemptAnswers(data.attemptAnswers || []));

      await safeCreateMany('practiceSession', filterBySubject(data.practiceSessions || [], 'subjectId', 'practiceSessions'), ['studentId']);
      
      const existingSessions = await tx.practiceSession.findMany({ select: { id: true } });
      const validSessionIds = new Set(existingSessions.map(s => s.id));

      const filterPracticeAttempts = (items) => items.filter(item => {
        if (!validSessionIds.has(item.practiceSessionId) || !validQuestionIds.has(item.questionId)) {
          report.recordsSkipped++; 
          report.details.practiceAttempts.skipped++;
          report.skippedReasons.push({
             entity: 'practiceAttempts',
             identifier: item.id || 'Unknown',
             reason: `Missing valid practiceSessionId or questionId.`
          });
          return false;
        }
        return true;
      });
      await safeCreateMany('practiceAttempt', filterPracticeAttempts(data.practiceAttempts || []), ['studentId']);

      await safeCreateMany('notification', data.notifications || [], ['userId']);
      await safeCreateMany('systemSetting', data.systemSettings || []);
      await safeCreateMany('auditLog', data.auditLogs || [], ['userId']);

      // If dry run, force rollback to ensure nothing is committed
      if (isDryRun) {
        throw new Error('DRY_RUN_SUCCESS');
      }
    });
  } catch (error) {
    if (error.message === 'DRY_RUN_SUCCESS') {
      return { success: true, isDryRun: true, report };
    }
    console.error('Restore failed:', error);
    report.errors.push(error.message);
    return { success: false, isDryRun, report, errors: [error.message] };
  }

  return { success: true, isDryRun: false, report };
};
