const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      user: userId, 
      action, 
      entity: entityType, 
      startDate, 
      endDate, 
      sort = 'newest' 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma where clause
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const orderBy = {
      createdAt: sort === 'oldest' ? 'asc' : 'desc'
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    return sendSuccess(res, log);
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogActions = async (req, res, next) => {
  try {
    const actions = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' }
    });
    
    return sendSuccess(res, actions.map(a => a.action));
  } catch (err) {
    next(err);
  }
};
