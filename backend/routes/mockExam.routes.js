const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const mockExamController = require('../controllers/mockExam.controller');

const teacherOnly = [authenticate, requireRole('TEACHER')];

router.use(teacherOnly);

router.get('/', mockExamController.getMockExams);
router.post('/', mockExamController.createMockExam);
router.get('/:id', mockExamController.getMockExamById);
router.put('/:id', mockExamController.updateMockExam);
router.delete('/:id', mockExamController.deleteMockExam);

module.exports = router;
