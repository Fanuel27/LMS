const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All endpoints require authentication
router.use(authenticate);

// Standard Notification endpoints (accessible to all authenticated users)
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin-only announcement creation endpoint
// Note: We mount this on /api/notifications/announcements internally, 
// though the prompt suggested /api/admin/announcements. We can use either.
// We'll expose it here and also in server.js to match the prompt perfectly.
router.post('/announcements', requireRole('ADMIN'), notificationController.createAnnouncement);

module.exports = router;
