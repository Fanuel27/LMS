const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All admin contact routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/', contactController.getContactMessages);
router.get('/:id', contactController.getContactMessageById);
router.put('/:id/read', contactController.markAsRead);
router.delete('/:id', contactController.deleteContactMessage);

module.exports = router;
