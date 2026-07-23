const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { createMockExamSchema, updateMockExamSchema } = require('../validators/mockExam.validator');
const notificationService = require('../services/notification.service');
const auditLogService = require('../services/auditLog.service');

// ─── GET /api/mock-exams ──────────────────────────────────────────────────────
exports.getMockExams = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 10, search = '', subjectId, isActive, sort = 'desc' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { teacherId };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      where.isActive = isActive === 'true';
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'alpha') orderBy = { title: 'asc' };

    const [total, exams] = await Promise.all([
      prisma.mockExam.count({ where }),
      prisma.mockExam.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        include: {
          subject: {
            select: { name: true, category: true },
          },
          _count: {
            select: { questions: true },
          }
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(
      res,
      {
        exams,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      'Mock exams retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mock-exams/:id ──────────────────────────────────────────────────
exports.getMockExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const exam = await prisma.mockExam.findFirst({
      where: { id, teacherId },
      include: {
        subject: { select: { name: true } },
        questions: {
          include: {
            question: true
          }
        }
      },
    });

    if (!exam) {
      return sendError(res, 'Mock exam not found or you do not have access.', 404);
    }

    return sendSuccess(res, exam, 'Mock exam retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/mock-exams ─────────────────────────────────────────────────────
exports.createMockExam = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const validatedData = createMockExamSchema.parse(req.body);
    const { questionIds, ...examData } = validatedData;

    // Verify all questions belong to the teacher (security)
    const validQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        teacherId,
      },
      select: { id: true },
    });

    if (validQuestions.length !== questionIds.length) {
      return sendError(res, 'One or more questions are invalid or do not belong to you.', 400);
    }

    const newExam = await prisma.mockExam.create({
      data: {
        ...examData,
        teacherId,
        numberOfQuestions: questionIds.length,
        questions: {
          create: questionIds.map((qId) => ({
            questionId: qId,
          })),
        },
      },
      include: {
        subject: { select: { name: true } },
        _count: {
          select: { questions: true },
        }
      },
    });

    if (newExam.isActive) {
      await notificationService.notifyRole('STUDENT', 'New Mock Exam Published', `A new mock exam "${newExam.title}" is now available for ${newExam.subject.name}.`, 'INFO');
      await notificationService.notifyUser(teacherId, 'Mock Exam Published', `Your mock exam "${newExam.title}" is now published.`, 'SUCCESS');
    }

    auditLogService.log({
      userId: teacherId,
      action: 'CREATE_MOCK_EXAM',
      entityType: 'MockExam',
      entityId: newExam.id,
      description: `Created mock exam ${newExam.title}`,
      req
    });

    return sendSuccess(res, newExam, 'Mock exam created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/mock-exams/:id ──────────────────────────────────────────────────
exports.updateMockExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    const validatedData = updateMockExamSchema.parse(req.body);
    const { questionIds, ...examData } = validatedData;

    const existing = await prisma.mockExam.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return sendError(res, 'Mock exam not found or you do not have access.', 404);
    }

    // Update query inside transaction if questions are modified
    const updatedExam = await prisma.$transaction(async (tx) => {
      let numberOfQuestions = existing.numberOfQuestions;

      if (questionIds) {
        // Verify ownership
        const validQuestions = await tx.question.findMany({
          where: {
            id: { in: questionIds },
            teacherId,
          },
          select: { id: true },
        });

        if (validQuestions.length !== questionIds.length) {
          throw new Error('INVALID_QUESTIONS');
        }

        // Delete existing relationships
        await tx.mockExamQuestion.deleteMany({
          where: { mockExamId: id },
        });

        numberOfQuestions = questionIds.length;

        await tx.mockExam.update({
          where: { id },
          data: {
            questions: {
              create: questionIds.map((qId) => ({ questionId: qId })),
            },
          },
        });
      }

      return await tx.mockExam.update({
        where: { id },
        data: {
          ...examData,
          numberOfQuestions,
        },
        include: {
          subject: { select: { name: true } },
          _count: { select: { questions: true } },
        },
      });
    });

    if (updatedExam.isActive && !existing.isActive) {
      await notificationService.notifyRole('STUDENT', 'New Mock Exam Published', `A new mock exam "${updatedExam.title}" is now available for ${updatedExam.subject.name}.`, 'INFO');
      await notificationService.notifyUser(teacherId, 'Mock Exam Published', `Your mock exam "${updatedExam.title}" is now published.`, 'SUCCESS');
      
      auditLogService.log({
        userId: teacherId,
        action: 'ACTIVATE_MOCK_EXAM',
        entityType: 'MockExam',
        entityId: id,
        description: `Activated mock exam ${updatedExam.title}`,
        req
      });
    } else if (!updatedExam.isActive && existing.isActive) {
      auditLogService.log({
        userId: teacherId,
        action: 'DEACTIVATE_MOCK_EXAM',
        entityType: 'MockExam',
        entityId: id,
        description: `Deactivated mock exam ${updatedExam.title}`,
        req
      });
    } else {
      auditLogService.log({
        userId: teacherId,
        action: 'UPDATE_MOCK_EXAM',
        entityType: 'MockExam',
        entityId: id,
        description: `Updated mock exam ${updatedExam.title}`,
        req
      });
    }

    return sendSuccess(res, updatedExam, 'Mock exam updated successfully.');
  } catch (err) {
    if (err.message === 'INVALID_QUESTIONS') {
      return sendError(res, 'One or more questions are invalid or do not belong to you.', 400);
    }
    next(err);
  }
};

// ─── DELETE /api/mock-exams/:id ───────────────────────────────────────────────
exports.deleteMockExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const existing = await prisma.mockExam.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return sendError(res, 'Mock exam not found or you do not have access.', 404);
    }

    await prisma.mockExam.delete({
      where: { id },
    });

    auditLogService.log({
      userId: teacherId,
      action: 'DELETE_MOCK_EXAM',
      entityType: 'MockExam',
      entityId: id,
      description: `Deleted mock exam ${id}`,
      req
    });

    return sendSuccess(res, null, 'Mock exam deleted successfully.');
  } catch (err) {
    next(err);
  }
};
