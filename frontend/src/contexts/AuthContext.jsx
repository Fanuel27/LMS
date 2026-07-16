import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/auth.service'
import { queryClient } from '@/lib/queryClient'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app and provides auth state globally.
 * User is persisted in localStorage and verified against /api/auth/me on mount.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // On mount — verify the stored session is still valid
  useEffect(() => {
    const verifySession = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const { data } = await authService.me()
        setUser(data.data)
        localStorage.setItem('user', JSON.stringify(data.data))
      } catch {
        // Token invalid or expired
        setUser(null)
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }
    verifySession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password, role) => {
    const { data } = await authService.login(email, password, role)
    const userData = data.data.user
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Logout best-effort
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      queryClient.clear()
    }
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
