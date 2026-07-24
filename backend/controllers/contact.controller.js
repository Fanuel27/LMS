const prisma = require('../config/db');
const { sendSuccess } = require('../utils/response');
const auditLogService = require('../services/auditLog.service');
const notificationService = require('../services/notification.service');

// ─── Public Endpoints ────────────────────────────────────────────────────────

exports.submitContact = async (req, res, next) => {
  try {
    const { fullName, email, subject, message } = req.body;

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        fullName,
        email,
        subject,
        message,
      },
    });

    auditLogService.log({
      userId: req.user?.id || null, // Might be unauthenticated
      action: 'CONTACT_MESSAGE_CREATED',
      entityType: 'ContactMessage',
      entityId: contactMessage.id,
      description: `New contact message submitted by ${fullName}.`,
      req,
    });

    // Notify all Admins
    await notificationService.notifyRole(
      'ADMIN',
      'New Contact Message',
      `You received a new message from ${fullName}: ${subject}`,
      'INFO'
    );

    return sendSuccess(res, contactMessage, 'Message sent successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

exports.getContactMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'ALL' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'UNREAD') {
      where.isRead = false;
    } else if (status === 'READ') {
      where.isRead = true;
    }

    const [total, messages, unreadCount] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limitNumber,
        // Sort by Unread first, then Newest first
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(
      res,
      {
        messages,
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages },
        unreadCount,
      },
      'Contact messages retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

exports.getContactMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    return sendSuccess(res, message, 'Message retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });

    auditLogService.log({
      userId: req.user.id,
      action: 'CONTACT_MESSAGE_READ',
      entityType: 'ContactMessage',
      entityId: id,
      description: `Marked contact message from ${existingMessage.email} as read.`,
      req,
    });

    return sendSuccess(res, updatedMessage, 'Message marked as read.');
  } catch (err) {
    next(err);
  }
};

exports.deleteContactMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    auditLogService.log({
      userId: req.user.id,
      action: 'CONTACT_MESSAGE_DELETED',
      entityType: 'ContactMessage',
      entityId: id,
      description: `Deleted contact message from ${existingMessage.email}.`,
      req,
    });

    return sendSuccess(res, null, 'Message deleted successfully.');
  } catch (err) {
    next(err);
  }
};
