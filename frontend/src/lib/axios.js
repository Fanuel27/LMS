import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,       // send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // If 401 and not on a login page, redirect to root for re-login
    if (status === 401) {
      const path = window.location.pathname
      const isLoginPage = path.includes('/login')
      if (!isLoginPage) {
        localStorage.removeItem('user')
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

export default api
