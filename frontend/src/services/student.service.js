import api from '@/lib/axios';

export const studentService = {
  getStats: () => api.get('/student/stats'),
  getSubjects: () => api.get('/student/subjects'),
  getNotes: (params) => api.get('/student/notes', { params }),
  downloadNotePdf: (id) => api.get(`/student/notes/${id}/download`, { responseType: 'blob' }),
  startPracticeSession: (data) => api.post('/student/practice/start', data),
  submitPracticeAnswer: (data) => api.post('/student/practice/submit', data),
  finishPracticeSession: (sessionId) => api.post(`/student/practice/session/${sessionId}/finish`),
  getPracticeSessions: (params) => api.get('/student/practice/sessions', { params }),
  getPracticeProgress: () => api.get('/student/practice/progress'),
  
  getMockExams: (params) => api.get('/student/mock-exams', { params }),
  getMockExamHistory: (params) => api.get('/student/mock-exams/history', { params }),
  getMockExamHistoryDetails: (attemptId) => api.get(`/student/mock-exams/history/${attemptId}`),
  getMockExamDetails: (id) => api.get(`/student/mock-exams/${id}`),
  startMockExam: (id) => api.post(`/student/mock-exams/${id}/start`),
  submitMockExam: (id, data) => api.post(`/student/mock-exams/${id}/submit`, data),
};
