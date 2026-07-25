const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { announcementSchema } = require('../validators/notification.validator');
const notificationService = require('../services/notification.service');
const auditLogService = require('../services/auditLog.service');

// ─── GET /api/notifications ───────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null } // System announcements
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return sendSuccess(res, notifications, 'Notifications retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    const announcements = await prisma.notification.findMany({
      where: { userId: null },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return sendSuccess(res, { 
      count,
      announcementIds: announcements.map(a => `${a.id}_${new Date(a.updatedAt).getTime()}`)
    }, 'Unread count retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/:id/read ──────────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return sendError(res, 'Notification not found.', 404);
    }

    if (notification.userId === null) {
      return sendError(res, 'Announcements cannot be marked as read.', 400);
    }

    if (notification.userId !== userId) {
      return sendError(res, 'Forbidden.', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return sendSuccess(res, updated, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/read-all ──────────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return sendError(res, 'Notification not found.', 404);
    }

    if (notification.userId === null) {
      return sendError(res, 'Announcements cannot be deleted.', 400);
    }

    if (notification.userId !== userId) {
      return sendError(res, 'Forbidden.', 403);
    }

    await prisma.notification.delete({ where: { id } });
    return sendSuccess(res, null, 'Notification deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/admin/announcements ────────────────────────────────────────────
exports.createAnnouncement = async (req, res, next) => {
  try {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const { title, message, type } = parsed.data;

    const announcement = await notificationService.createAnnouncement(title, message, type);
    
    auditLogService.log({
      userId: req.user.id,
      action: 'CREATE_ANNOUNCEMENT',
      entityType: 'Notification',
      entityId: announcement.id,
      description: `Created announcement: ${title}`,
      req
    });

    return sendSuccess(res, announcement, 'Announcement created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/announcements ─────────────────────────────────────────────
exports.getAdminAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', type, sort = 'desc' } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { userId: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    const orderBy = { createdAt: sort === 'asc' ? 'asc' : 'desc' };

    const [total, announcements] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(
      res,
      {
        announcements,
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages },
      },
      'Announcements retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/announcements/:id ─────────────────────────────────────────
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed.', 422, parsed.error.flatten().fieldErrors);
    }

    const { title, message, type } = parsed.data;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: null },
    });

    if (!existing) {
      return sendError(res, 'Announcement not found.', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { title, message, type: type || existing.type, createdAt: new Date() },
    });


    auditLogService.log({
      userId: req.user.id,
      action: 'UPDATE_ANNOUNCEMENT',
      entityType: 'Notification',
      entityId: id,
      description: `Updated announcement: ${title}`,
      req
    });

    return sendSuccess(res, updated, 'Announcement updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/admin/announcements/:id ──────────────────────────────────────
exports.deleteAdminAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: null },
    });

    if (!existing) {
      return sendError(res, 'Announcement not found.', 404);
    }

    await prisma.notification.delete({ where: { id } });

    auditLogService.log({
      userId: req.user.id,
      action: 'DELETE_ANNOUNCEMENT',
      entityType: 'Notification',
      entityId: id,
      description: `Deleted announcement: ${existing.title}`,
      req
    });

    return sendSuccess(res, null, 'Announcement deleted successfully.');
  } catch (err) {
    next(err);
  }
};
