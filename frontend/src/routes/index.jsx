import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

// Auth pages
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import TeacherLoginPage from '@/pages/auth/TeacherLoginPage'
import StudentLoginPage from '@/pages/auth/StudentLoginPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminTeachersPage from '@/pages/admin/AdminTeachersPage'

// Teacher / Student dashboard stubs
import TeacherDashboard from '@/pages/teacher/TeacherDashboard'
import TeacherSubjectsPage from '@/pages/teacher/TeacherSubjectsPage'
import TeacherQuestionsPage from '@/pages/teacher/TeacherQuestionsPage'
import TeacherNotesPage from '@/pages/teacher/TeacherNotesPage'
import TeacherMockExamsPage from '@/pages/teacher/TeacherMockExamsPage'
import TeacherAnalyticsPage from '@/pages/teacher/TeacherAnalyticsPage'
import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentSubjectsPage from '@/pages/student/StudentSubjectsPage'
import StudentPracticePage from '@/pages/student/StudentPracticePage'
import StudentNotesPage from '@/pages/student/StudentNotesPage'
import StudentExamsPage from '@/pages/student/StudentExamsPage'
import StudentProgressPage from '@/pages/student/StudentProgressPage'
import StudentProfilePage from '@/pages/student/StudentProfilePage'

// Layouts
import AdminLayout from '@/layouts/AdminLayout'
import TeacherLayout from '@/layouts/TeacherLayout'
import StudentLayout from '@/layouts/StudentLayout'

// Public landing
import LandingPage from '@/pages/public/LandingPage'

/**
 * RootRedirect — shows landing page for guests, dashboard redirect for authenticated users.
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
      {/* ── Public ─────────────────────────────────────────────────────── */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/teacher/login" element={<TeacherLoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />

      {/* ── Admin — protected ───────────────────────────────────────────── */}
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
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
      </Route>

      {/* ── Teacher — protected ─────────────────────────────────────────── */}
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
        <Route path="subjects" element={<TeacherSubjectsPage />} />
        <Route path="questions" element={<TeacherQuestionsPage />} />
        <Route path="notes" element={<TeacherNotesPage />} />
        <Route path="exams" element={<TeacherMockExamsPage />} />
        <Route path="analytics" element={<TeacherAnalyticsPage />} />
      </Route>

      {/* ── Student — protected ─────────────────────────────────────────── */}
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
        <Route path="subjects" element={<StudentSubjectsPage />} />
        <Route path="practice" element={<StudentPracticePage />} />
        <Route path="notes" element={<StudentNotesPage />} />
        <Route path="exams" element={<StudentExamsPage />} />
        <Route path="progress" element={<StudentProgressPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
