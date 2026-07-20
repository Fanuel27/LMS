import api from '@/lib/axios';

export const studentService = {
  getStats: () => api.get('/student/stats'),
};
