const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const noteController = require('../controllers/note.controller');

const teacherOnly = [authenticate, requireRole('TEACHER')];

router.use(teacherOnly);

router.get('/', noteController.getNotes);
router.post('/', upload.single('pdfFile'), handleUploadError, noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.get('/:id/download', noteController.downloadNotePdf);
router.put('/:id', upload.single('pdfFile'), handleUploadError, noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
