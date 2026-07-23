import api from '@/lib/axios';

export const getAuditLogs = async (params) => {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data.data;
};

export const getAuditLogById = async (id) => {
  const { data } = await api.get(`/admin/audit-logs/${id}`);
  return data.data;
};

export const getAuditLogActions = async () => {
  const { data } = await api.get('/admin/audit-logs/actions');
  return data.data;
};
