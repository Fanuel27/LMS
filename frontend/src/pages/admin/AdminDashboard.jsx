import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Users, BookOpen, HelpCircle, FileText, ClipboardList,
  ArrowRight, Activity, TrendingUp, BarChart2, UserPlus, UserCheck,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/user.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import StatCard from '@/components/admin/StatCard'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'

// ─── Quick Actions ────────────────────────────────────────────────────────────

const quickActions = [
  {
    id: 'qa-add-student',
    label: 'Add Student',
    description: 'Create a new student account',
    icon: UserPlus,
    iconBg: 'bg-blue-100 text-blue-600',
    to: '/admin/students',
  },
  {
    id: 'qa-add-teacher',
    label: 'Add Teacher',
    description: 'Create a new teacher account',
    icon: UserCheck,
    iconBg: 'bg-emerald-100 text-emerald-600',
    to: '/admin/teachers',
  },
  {
    id: 'qa-manage-students',
    label: 'Manage Students',
    description: 'View, edit, or deactivate students',
    icon: GraduationCap,
    iconBg: 'bg-violet-100 text-violet-600',
    to: '/admin/students',
  },
  {
    id: 'qa-manage-teachers',
    label: 'Manage Teachers',
    description: 'View, edit, or deactivate teachers',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-600',
    to: '/admin/teachers',
  },
]

// ─── System Overview rows ────────────────────────────────────────────────────

function SystemOverviewRow({ label, value, isLoading }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isLoading ? (
        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
      ) : (
        <span className="text-sm font-semibold text-foreground">{value ?? '—'}</span>
      )}
    </div>
  )
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] ?? 'Admin'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await userService.getStats()
      return res.data.data
    },
    retry: 1,
    staleTime: 30_000,
  })

  const statCards = [
    {
      title: 'Total Students',
      value: data?.students,
      icon: GraduationCap,
      iconBg: 'bg-blue-100 text-blue-600',
      trend: data?.students ? undefined : undefined,
    },
    {
      title: 'Total Teachers',
      value: data?.teachers,
      icon: Users,
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Subjects',
      value: data?.subjects,
      icon: BookOpen,
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Questions',
      value: data?.questions,
      icon: HelpCircle,
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Study Notes',
      value: data?.notes,
      icon: FileText,
      iconBg: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'Mock Exams',
      value: data?.mockExams,
      icon: ClipboardList,
      iconBg: 'bg-teal-100 text-teal-600',
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Welcome ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's a live overview of the platform activity.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium shrink-0">
          <Activity className="w-3.5 h-3.5" />
          Platform Active
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {isError && (
        <ErrorBanner
          message="Failed to load platform statistics."
          onRetry={refetch}
        />
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <StatCard key={s.title} {...s} isLoading={isLoading} />
          ))}
        </div>
      )}

      {/* ── Quick Actions + System Overview ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Actions — 3/5 width */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map(({ id, label, description, icon: Icon, iconBg, to }) => (
              <Link
                key={id}
                id={id}
                to={to}
                className="group flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md hover:-translate-y-px transition-all duration-150"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* System Overview — 2/5 width */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            System Overview
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-2">
                <SystemOverviewRow
                  label="Total Registered Users"
                  value={(data?.students ?? 0) + (data?.teachers ?? 0)}
                  isLoading={isLoading}
                />
                <SystemOverviewRow
                  label="Teacher-to-Student Ratio"
                  value={
                    data?.teachers && data?.students
                      ? `1 : ${Math.round(data.students / data.teachers)}`
                      : '—'
                  }
                  isLoading={isLoading}
                />
                <SystemOverviewRow
                  label="Avg. Questions per Subject"
                  value={
                    data?.subjects && data?.questions
                      ? Math.round(data.questions / data.subjects)
                      : '—'
                  }
                  isLoading={isLoading}
                />
                <SystemOverviewRow
                  label="Notes per Teacher"
                  value={
                    data?.teachers && data?.notes
                      ? (data.notes / data.teachers).toFixed(1)
                      : '—'
                  }
                  isLoading={isLoading}
                />
                <SystemOverviewRow
                  label="Active Mock Exams"
                  value={data?.mockExams}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recent Activity placeholder ────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Recent Activity
        </h2>
        <Card>
          <CardContent className="p-0">
            {[
              { text: 'System initialised with seed data', time: 'Set-up', dot: 'bg-emerald-500' },
              { text: 'Admin account created', time: 'Set-up', dot: 'bg-blue-500' },
              { text: 'Subject catalogue loaded (10 subjects)', time: 'Set-up', dot: 'bg-violet-500' },
            ].map(({ text, time, dot }) => (
              <div
                key={text}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0"
              >
                <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                <p className="flex-1 text-sm text-foreground">{text}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
              </div>
            ))}
            <div className="px-5 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Full activity log will appear here as the platform is used.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
