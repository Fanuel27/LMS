const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLog.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate, requireRole('ADMIN'));

router.get('/', auditLogController.getAuditLogs);
router.get('/actions', auditLogController.getAuditLogActions);
router.get('/:id', auditLogController.getAuditLogById);

module.exports = router;
