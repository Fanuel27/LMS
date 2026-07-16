import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
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
