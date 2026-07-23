const express = require('express');
const router = express.Router();
const multer = require('multer');
const backupController = require('../controllers/backup.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Protect all backup routes
router.use(authenticate, requireRole('ADMIN'));

// Setup multer for in-memory file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

// CSV Exports
router.get('/export/users', backupController.exportUsers);
router.get('/export/students', backupController.exportStudents);
router.get('/export/questions', backupController.exportQuestions);
router.get('/export/mock-exams', backupController.exportMockExams);
router.get('/export/results', backupController.exportResults);
router.get('/export/audit-logs', backupController.exportAuditLogs);
router.get('/export/settings', backupController.exportSettings);

// JSON Backup / Restore
router.post('/create', backupController.createBackup);
router.post('/restore', upload.single('backupFile'), backupController.restoreBackup);

module.exports = router;
