import api from '@/lib/axios'

export const userService = {
  // Admin stats
  getStats: () => api.get('/admin/stats'),

  // Students
  getStudents: (params) => api.get('/students', { params }),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),

  // Teachers
  getTeachers: (params) => api.get('/teachers', { params }),
  createTeacher: (data) => api.post('/teachers', data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),

  // Admin — any user
  getUserById: (id) => api.get(`/admin/users/${id}`),
  resetPassword: (id, newPassword) =>
    api.put(`/admin/users/${id}/reset-password`, { newPassword }),

  // Profile (self)
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (currentPassword, newPassword) =>
    api.put('/profile/password', { currentPassword, newPassword }),
}

export const teacherService = {
  // Teacher personal stats
  getStats: () => api.get('/subjects/teacher/stats'),

  // Subjects (accessible to teacher + admin)
  getSubjects: (params) => api.get('/subjects', { params }),
}
