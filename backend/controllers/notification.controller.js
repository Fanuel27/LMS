const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');
const notificationService = require('../services/notification.service');

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
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId === null) {
      return res.status(400).json({ success: false, message: 'Announcements cannot be marked as read.' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
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
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId === null) {
      return res.status(400).json({ success: false, message: 'Announcements cannot be deleted.' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
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
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const announcement = await notificationService.createAnnouncement(title, message, type);
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
    const { title, message, type } = req.body;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { title, message, type: type || existing.type, createdAt: new Date() },
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
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    await prisma.notification.delete({ where: { id } });

    return sendSuccess(res, null, 'Announcement deleted successfully.');
  } catch (err) {
    next(err);
  }
};
