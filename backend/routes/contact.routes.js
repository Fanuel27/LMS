const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// ─── Public Endpoint ─────────────────────────────────────────────────────────

// POST /api/contact
router.post('/', contactController.submitContact);

module.exports = router;
