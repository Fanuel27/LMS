import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageLoader } from '@/components/common/LoadingSpinner'

/**
 * ProtectedRoute — guards a route by authentication and role.
 *
 * @param {React.ReactNode} children
 * @param {'ADMIN'|'TEACHER'|'STUDENT'} allowedRole
 * @param {string} redirectTo  — where to redirect unauthenticated users
 */
export function ProtectedRoute({ children, allowedRole, redirectTo = '/' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullPageLoader label="Loading…" />
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to correct dashboard based on actual role
    const roleRedirects = {
      ADMIN: '/admin/dashboard',
      TEACHER: '/teacher/dashboard',
      STUDENT: '/student/dashboard',
    }
    return <Navigate to={roleRedirects[user.role] || '/'} replace />
  }

  return children
}

