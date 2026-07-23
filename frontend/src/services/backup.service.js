import api from '@/lib/axios';

export const backupService = {
  // CSV Exports
  exportUsers: () => api.get('/admin/backups/export/users', { responseType: 'blob' }).then(res => res.data),
  exportStudents: () => api.get('/admin/backups/export/students', { responseType: 'blob' }).then(res => res.data),
  exportQuestions: () => api.get('/admin/backups/export/questions', { responseType: 'blob' }).then(res => res.data),
  exportMockExams: () => api.get('/admin/backups/export/mock-exams', { responseType: 'blob' }).then(res => res.data),
  exportResults: () => api.get('/admin/backups/export/results', { responseType: 'blob' }).then(res => res.data),
  exportAuditLogs: () => api.get('/admin/backups/export/audit-logs', { responseType: 'blob' }).then(res => res.data),
  exportSettings: () => api.get('/admin/backups/export/settings', { responseType: 'blob' }).then(res => res.data),

  // Backup & Restore
  createBackup: () => api.post('/admin/backups/create', {}, { responseType: 'blob' }).then(res => res.data),
  
  restoreBackup: (file, mode = 'MERGE', isDryRun = false) => {
    const formData = new FormData();
    formData.append('backupFile', file);
    formData.append('mode', mode);
    formData.append('isDryRun', isDryRun);
    
    return api.post('/admin/backups/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
