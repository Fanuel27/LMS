const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All analytics routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/analytics/overview', adminController.getOverview);
router.get('/analytics/users', adminController.getUsersAnalytics);
router.get('/analytics/subjects', adminController.getSubjectsAnalytics);
router.get('/analytics/activity', adminController.getActivityFeed);
router.get('/analytics/performance', adminController.getPerformanceAnalytics);

module.exports = router;
