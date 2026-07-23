const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate, requireRole('ADMIN'));

router.get('/', systemSettingsController.getSettings);
router.put('/', systemSettingsController.updateSettings);
router.post('/reset', systemSettingsController.resetSettings);
router.get('/info', systemSettingsController.getSystemInfo);

module.exports = router;
