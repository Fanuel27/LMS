const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const studentOnly = [authenticate, requireRole('STUDENT')];

router.use(studentOnly);

router.get('/stats', studentController.getStats);
router.get('/subjects', studentController.getSubjects);
router.get('/notes', studentController.getNotes);
router.get('/notes/:id/download', studentController.downloadNotePdf);

router.post('/practice/start', studentController.startPracticeSession);
router.post('/practice/submit', studentController.submitPracticeAnswer);
router.post('/practice/session/:id/finish', studentController.finishPracticeSession);
router.get('/practice/sessions', studentController.getPracticeSessions);
router.get('/practice/progress', studentController.getPracticeProgress);

router.get('/mock-exams', studentController.getMockExams);
router.get('/mock-exams/history', studentController.getMockExamHistory);
router.get('/mock-exams/history/:attemptId', studentController.getMockExamHistoryDetails);
router.get('/mock-exams/:id', studentController.getMockExamDetails);
router.post('/mock-exams/:id/start', studentController.startMockExam);
router.post('/mock-exams/:id/submit', studentController.submitMockExam);

module.exports = router;
