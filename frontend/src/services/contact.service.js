import api from '../lib/axios';

export const contactService = {
  submitContact: async (data) => {
    const response = await api.post('/contact', data);
    return response.data;
  },

  getContactMessages: async (params) => {
    const response = await api.get('/admin/contact', { params });
    return response.data;
  },

  getContactMessage: async (id) => {
    const response = await api.get(`/admin/contact/${id}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/admin/contact/${id}/read`);
    return response.data;
  },

  deleteContactMessage: async (id) => {
    const response = await api.delete(`/admin/contact/${id}`);
    return response.data;
  },
};
