const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const adminOnly = [authenticate, requireRole('ADMIN')];
const teacherOrAdmin = [authenticate, requireRole('ADMIN', 'TEACHER')];
const anyAuth = [authenticate];

// ─── Admin Stats ─────────────────────────────────────────────────────────────
router.get('/admin/stats', ...adminOnly, ctrl.getStats);

// ─── Student Management (Admin only) ─────────────────────────────────────────
router.get('/students', ...adminOnly, ctrl.getStudents);
router.post('/students', ...adminOnly, ctrl.createStudent);
router.put('/students/:id', ...adminOnly, ctrl.updateUser);
router.delete('/students/:id', ...adminOnly, ctrl.deleteUser);

// ─── Teacher Management (Admin only) ─────────────────────────────────────────
router.get('/teachers', ...teacherOrAdmin, ctrl.getTeachers);
router.post('/teachers', ...adminOnly, ctrl.createTeacher);
router.put('/teachers/:id', ...adminOnly, ctrl.updateUser);
router.delete('/teachers/:id', ...adminOnly, ctrl.deleteUser);

// ─── Admin: Get or Reset any user's password ──────────────────────────────────
router.get('/admin/users/:id', ...adminOnly, ctrl.getUserById);
router.put('/admin/users/:id/reset-password', ...adminOnly, ctrl.resetPassword);

// ─── Profile (any authenticated user) ─────────────────────────────────────────
router.put('/profile', ...anyAuth, ctrl.updateProfile);
router.put('/profile/password', ...anyAuth, ctrl.changePassword);

module.exports = router;
