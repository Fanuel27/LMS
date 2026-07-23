const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { createQuestionSchema } = require('../validators/question.validator');
const notificationService = require('../services/notification.service');
const auditLogService = require('../services/auditLog.service');

// ─── GET /api/questions ───────────────────────────────────────────────────────
exports.getQuestions = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 10, search = '', subjectId, sort = 'desc' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { teacherId };

    if (search) {
      where.question = { contains: search, mode: 'insensitive' };
    }

    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    const orderBy = { createdAt: sort === 'asc' ? 'asc' : 'desc' };

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        include: {
          subject: {
            select: { name: true, category: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(
      res,
      {
        questions,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      'Questions retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/questions/:id ───────────────────────────────────────────────────
exports.getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const question = await prisma.question.findFirst({
      where: { id, teacherId },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!question) {
      return sendError(res, 'Question not found or you do not have access.', 404);
    }

    return sendSuccess(res, question, 'Question retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/questions ──────────────────────────────────────────────────────
exports.createQuestion = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const validatedData = createQuestionSchema.parse(req.body);

    const question = await prisma.question.create({
      data: {
        teacherId,
        ...validatedData,
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    await notificationService.notifyUser(teacherId, 'Question Created', `Your question was created successfully.`, 'SUCCESS');

    auditLogService.log({
      userId: teacherId,
      action: 'CREATE_QUESTION',
      entityType: 'Question',
      entityId: question.id,
      description: `Created a new question in subject ${question.subject.name}`,
      req
    });

    return sendSuccess(res, question, 'Question created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/questions/:id ───────────────────────────────────────────────────
exports.updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const validatedData = createQuestionSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.question.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return sendError(res, 'Question not found or you do not have access.', 404);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: validatedData,
      include: {
        subject: { select: { name: true } },
      },
    });

    await notificationService.notifyUser(teacherId, 'Question Updated', `Your question was updated successfully.`, 'SUCCESS');

    auditLogService.log({
      userId: teacherId,
      action: 'UPDATE_QUESTION',
      entityType: 'Question',
      entityId: id,
      description: `Updated question ${id}`,
      req
    });

    return sendSuccess(res, updatedQuestion, 'Question updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/questions/:id ────────────────────────────────────────────────
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Verify ownership
    const existing = await prisma.question.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return sendError(res, 'Question not found or you do not have access.', 404);
    }

    await prisma.question.delete({
      where: { id },
    });

    await notificationService.notifyUser(teacherId, 'Question Deleted', `Your question was deleted successfully.`, 'INFO');

    auditLogService.log({
      userId: teacherId,
      action: 'DELETE_QUESTION',
      entityType: 'Question',
      entityId: id,
      description: `Deleted question ${id}`,
      req
    });

    return sendSuccess(res, null, 'Question deleted successfully.');
  } catch (err) {
    next(err);
  }
};
