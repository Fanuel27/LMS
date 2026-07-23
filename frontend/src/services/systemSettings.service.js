import api from '@/lib/axios';

class SystemSettingsService {
  async getSettings() {
    return api.get('/admin/settings');
  }

  async updateSettings(data) {
    return api.put('/admin/settings', data);
  }

  async resetSettings() {
    return api.post('/admin/settings/reset');
  }

  async getSystemInfo() {
    return api.get('/admin/settings/info');
  }
}

export const systemSettingsService = new SystemSettingsService();
