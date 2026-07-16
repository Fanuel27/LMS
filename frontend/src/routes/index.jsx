import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

// Auth pages (stub — replaced in Phase 2)
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import TeacherLoginPage from '@/pages/auth/TeacherLoginPage'
import StudentLoginPage from '@/pages/auth/StudentLoginPage'

// Dashboard stubs
import AdminDashboard from '@/pages/admin/AdminDashboard'
import TeacherDashboard from '@/pages/teacher/TeacherDashboard'
import StudentDashboard from '@/pages/student/StudentDashboard'

// Layouts
import AdminLayout from '@/layouts/AdminLayout'
import TeacherLayout from '@/layouts/TeacherLayout'
import StudentLayout from '@/layouts/StudentLayout'

// Public landing (stub — replaced in Phase 2)
import LandingPage from '@/pages/public/LandingPage'

/**
 * Root router — redirects authenticated users to their dashboard,
 * all other routes protected by role.
 */
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <LandingPage />

  const roleRoutes = {
    ADMIN: '/admin/dashboard',
    TEACHER: '/teacher/dashboard',
    STUDENT: '/student/dashboard',
  }
  return <Navigate to={roleRoutes[user.role] || '/'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/teacher/login" element={<TeacherLoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />

      {/* Admin — protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN" redirectTo="/admin/login">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Teacher — protected */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="TEACHER" redirectTo="/teacher/login">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
      </Route>

      {/* Student — protected */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT" redirectTo="/student/login">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
