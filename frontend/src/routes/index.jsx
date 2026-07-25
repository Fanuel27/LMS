import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Auth pages (eager loaded for fast initial render)
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import TeacherLoginPage from '@/pages/auth/TeacherLoginPage'
import StudentLoginPage from '@/pages/auth/StudentLoginPage'
import LandingPage from '@/pages/public/LandingPage'

// Layouts (eager loaded)
import AdminLayout from '@/layouts/AdminLayout'
import TeacherLayout from '@/layouts/TeacherLayout'
import StudentLayout from '@/layouts/StudentLayout'

// ─── Lazy Loaded Pages ────────────────────────────────────────────────────────
// Admin pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminStudentsPage = React.lazy(() => import('@/pages/admin/AdminStudentsPage'))
const AdminTeachersPage = React.lazy(() => import('@/pages/admin/AdminTeachersPage'))
const AdminAnnouncementsPage = React.lazy(() => import('@/pages/admin/AdminAnnouncementsPage'))
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminSystemSettingsPage = React.lazy(() => import('@/pages/admin/AdminSystemSettingsPage'))
const AdminAuditLogsPage = React.lazy(() => import('@/pages/admin/AdminAuditLogsPage'))
const AdminBackupsPage = React.lazy(() => import('@/pages/admin/AdminBackupsPage'))
const AdminContactMessagesPage = React.lazy(() => import('@/pages/admin/AdminContactMessagesPage'))
const AdminProfilePage = React.lazy(() => import('@/pages/admin/AdminProfilePage'))

// Teacher / Student dashboard pages
const TeacherDashboard = React.lazy(() => import('@/pages/teacher/TeacherDashboard'))
const TeacherSubjectsPage = React.lazy(() => import('@/pages/teacher/TeacherSubjectsPage'))
const TeacherQuestionsPage = React.lazy(() => import('@/pages/teacher/TeacherQuestionsPage'))
const TeacherNotesPage = React.lazy(() => import('@/pages/teacher/TeacherNotesPage'))
const TeacherMockExamsPage = React.lazy(() => import('@/pages/teacher/TeacherMockExamsPage'))
const TeacherAnalyticsPage = React.lazy(() => import('@/pages/teacher/TeacherAnalyticsPage'))

const StudentDashboard = React.lazy(() => import('@/pages/student/StudentDashboard'))
const StudentSubjectsPage = React.lazy(() => import('@/pages/student/StudentSubjectsPage'))
const StudentPracticePage = React.lazy(() => import('@/pages/student/StudentPracticePage'))
const StudentNotesPage = React.lazy(() => import('@/pages/student/StudentNotesPage'))
const StudentExamsPage = React.lazy(() => import('@/pages/student/StudentExamsPage'))
const StudentProgressPage = React.lazy(() => import('@/pages/student/StudentProgressPage'))
const StudentProfilePage = React.lazy(() => import('@/pages/student/StudentProfilePage'))

// Suspense Fallback Loader
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading module...</p>
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSystemSettingsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="backups" element={<AdminBackupsPage />} />
        <Route path="contact-messages" element={<AdminContactMessagesPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
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
    </Suspense>
  )
}
