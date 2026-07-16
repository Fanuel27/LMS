const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// GET /api/auth/me  — returns current user
router.get('/me', authenticate, me);

module.exports = router;
