import api from '@/lib/axios';

export const mockExamService = {
  getMockExams: (params) => api.get('/mock-exams', { params }),
  getMockExam: (id) => api.get(`/mock-exams/${id}`),
  createMockExam: (data) => api.post('/mock-exams', data),
  updateMockExam: (id, data) => api.put(`/mock-exams/${id}`, data),
  deleteMockExam: (id) => api.delete(`/mock-exams/${id}`),
};
