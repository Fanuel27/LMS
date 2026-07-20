import api from '@/lib/axios';

export const studentService = {
  getStats: () => api.get('/student/stats'),
  getSubjects: () => api.get('/student/subjects'),
  getNotes: (params) => api.get('/student/notes', { params }),
  downloadNotePdf: (id) => api.get(`/student/notes/${id}/download`, { responseType: 'blob' }),
};
