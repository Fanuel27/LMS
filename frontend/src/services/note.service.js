import api from '@/lib/axios';

export const noteService = {
  getNotes: (params) => api.get('/notes', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  // For file uploads, headers['Content-Type'] will automatically be set to 'multipart/form-data' by axios when data is FormData
  createNote: (data) => api.post('/notes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateNote: (id, data) => api.put(`/notes/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  downloadNotePdf: (id) => api.get(`/notes/${id}/download`, { responseType: 'blob' }),
};
