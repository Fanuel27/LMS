const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { createMockExamSchema, updateMockExamSchema } = require('../validators/mockExam.validator');

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

    return sendSuccess(res, null, 'Mock exam deleted successfully.');
  } catch (err) {
    next(err);
  }
};
