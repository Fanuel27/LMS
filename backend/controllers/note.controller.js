const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { createNoteSchema, updateNoteSchema } = require('../validators/note.validator');
const notificationService = require('../services/notification.service');
const auditLogService = require('../services/auditLog.service');

// Helper to delete old file
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to delete file:', filePath, err);
    }
  }
};

// ─── GET /api/notes ───────────────────────────────────────────────────────────
exports.getNotes = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 10, search = '', subjectId, sort = 'desc' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { teacherId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
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
        notes,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      'Notes retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/notes/:id ───────────────────────────────────────────────────────
exports.getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const note = await prisma.note.findFirst({
      where: { id, teacherId },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!note) {
      return sendError(res, 'Note not found or you do not have access.', 404);
    }

    return sendSuccess(res, note, 'Note retrieved.');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/notes ──────────────────────────────────────────────────────────
exports.createNote = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    if (!req.file) {
      return sendError(res, 'PDF file is required.', 400);
    }

    const validatedData = createNoteSchema.parse(req.body);

    const note = await prisma.note.create({
      data: {
        teacherId,
        pdfFile: req.file.filename,
        ...validatedData,
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    await notificationService.notifyRole(
      'STUDENT',
      'New Study Note',
      `A new note "${note.title}" was uploaded for ${note.subject.name}.`,
      'INFO'
    );

    await notificationService.notifyUser(
      teacherId,
      'Note Uploaded',
      `Your note "${note.title}" was successfully uploaded.`,
      'SUCCESS'
    );

    auditLogService.log({
      userId: teacherId,
      action: 'CREATE_NOTE',
      entityType: 'Note',
      entityId: note.id,
      description: `Uploaded note ${note.title}`,
      req
    });

    return sendSuccess(res, note, 'Note created successfully.', 201);
  } catch (err) {
    // If validation or DB fails, clean up the uploaded file
    if (req.file) {
      deleteFile(req.file.filename);
    }
    next(err);
  }
};

// ─── PUT /api/notes/:id ───────────────────────────────────────────────────────
exports.updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const validatedData = updateNoteSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      if (req.file) deleteFile(req.file.filename);
      return sendError(res, 'Note not found or you do not have access.', 404);
    }

    let newFilename = existing.pdfFile;

    // If a new file was uploaded, use it and delete the old one
    if (req.file) {
      newFilename = req.file.filename;
      deleteFile(existing.pdfFile);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...validatedData,
        pdfFile: newFilename,
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    auditLogService.log({
      userId: teacherId,
      action: 'UPDATE_NOTE',
      entityType: 'Note',
      entityId: id,
      description: `Updated note ${updatedNote.title}`,
      req
    });

    return sendSuccess(res, updatedNote, 'Note updated successfully.');
  } catch (err) {
    if (req.file) deleteFile(req.file.filename);
    next(err);
  }
};

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return sendError(res, 'Note not found or you do not have access.', 404);
    }

    // Delete file from disk
    deleteFile(existing.pdfFile);

    // Delete from DB
    await prisma.note.delete({
      where: { id },
    });

    auditLogService.log({
      userId: teacherId,
      action: 'DELETE_NOTE',
      entityType: 'Note',
      entityId: id,
      description: `Deleted note ${id}`,
      req
    });

    return sendSuccess(res, null, 'Note deleted successfully.');
  } catch (err) {
    next(err);
  }
};
// ─── GET /api/notes/:id/download ──────────────────────────────────────────────
exports.downloadNotePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const note = await prisma.note.findFirst({
      where: { id, teacherId },
    });

    if (!note) {
      return sendError(res, 'Note not found or you do not have access.', 404);
    }

    const filePath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', note.pdfFile);
    
    if (!fs.existsSync(filePath)) {
      return sendError(res, 'File not found on the server.', 404);
    }

    // Force browser download
    res.download(filePath, `${note.title}.pdf`);
  } catch (err) {
    next(err);
  }
};
