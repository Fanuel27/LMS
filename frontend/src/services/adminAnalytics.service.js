import api from '@/lib/axios';

class AdminAnalyticsService {
  async getOverview() {
    return api.get('/admin/analytics/overview');
  }

  async getUsersAnalytics() {
    return api.get('/admin/analytics/users');
  }

  async getSubjectsAnalytics() {
    return api.get('/admin/analytics/subjects');
  }

  async getActivityFeed() {
    return api.get('/admin/analytics/activity');
  }

  async getPerformanceAnalytics() {
    return api.get('/admin/analytics/performance');
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
