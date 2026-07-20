const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const studentOnly = [authenticate, requireRole('STUDENT')];

router.get('/stats', ...studentOnly, studentController.getStats);

module.exports = router;
