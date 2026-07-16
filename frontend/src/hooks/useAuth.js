import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

/**
 * Hook to consume AuthContext.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
