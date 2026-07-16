import api from '@/lib/axios'

export const authService = {
  /**
   * Login — sends role in body so backend can validate
   * @param {'ADMIN'|'TEACHER'|'STUDENT'} role
   */
  login: (email, password, role) =>
    api.post('/auth/login', { email, password, role }),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),
}
