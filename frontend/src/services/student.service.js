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
};
