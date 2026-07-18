import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  HelpCircle, FileText, ClipboardList, BarChart2,
  TrendingUp, Users, Star, Activity, BookMarked,
  Plus, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { teacherService } from '@/services/user.service'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import { cn } from '@/lib/utils'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend, loading, linkTo }) {
  const inner = (
    <Card className={cn('hover:shadow-md transition-shadow', linkTo && 'cursor-pointer group')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1">
                {value ?? '—'}
              </p>
            )}
            {trend && !loading && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>
        {linkTo && (
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium group-hover:gap-2 transition-all">
            View all <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  return linkTo ? <Link to={linkTo}>{inner}</Link> : inner
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickAction({ to, icon: Icon, label, description, iconBg, iconColor }) {
  return (
    <Link to={to}>
      <Card className="hover:bg-accent/40 hover:shadow-sm transition-all cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── TeacherDashboard ─────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const res = await teacherService.getStats()
      return res.data.data
    },
    staleTime: 30_000,
  })

  const firstName = user?.fullName?.split(' ')[0] || 'Teacher'

  const statCards = [
    {
      title: 'My Questions',
      value: data?.questions ?? 0,
      icon: HelpCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: 'Questions in your bank',
      linkTo: '/teacher/questions',
    },
    {
      title: 'My Notes',
      value: data?.notes ?? 0,
      icon: FileText,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      trend: 'Uploaded study materials',
      linkTo: '/teacher/notes',
    },
    {
      title: 'My Mock Exams',
      value: data?.mockExams ?? 0,
      icon: ClipboardList,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      trend: 'Published mock exams',
      linkTo: '/teacher/exams',
    },
    {
      title: 'Avg. Student Score',
      value: data?.avgScore != null ? `${data.avgScore}%` : '—',
      icon: Star,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      trend: data?.totalAttempts ? `Across ${data.totalAttempts} attempts` : 'No attempts yet',
    },
    {
      title: 'Students Practicing',
      value: data?.studentsPracticing ?? 0,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: 'Unique students active',
    },
    {
      title: 'Total Attempts',
      value: data?.totalAttempts ?? 0,
      icon: Activity,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      trend: 'Exam attempts on your content',
      linkTo: '/teacher/analytics',
    },
  ]

  const quickActions = [
    {
      to: '/teacher/subjects',
      icon: BookMarked,
      label: 'Browse Subjects',
      description: 'View available subjects & categories',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      to: '/teacher/questions',
      icon: HelpCircle,
      label: 'Question Bank',
      description: 'Create and manage exam questions',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      to: '/teacher/notes',
      icon: FileText,
      label: 'Study Notes',
      description: 'Upload and manage PDF notes',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      to: '/teacher/exams',
      icon: ClipboardList,
      label: 'Mock Exams',
      description: 'Build and schedule mock exams',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good day, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your teaching content and student activity.
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 shrink-0"
        >
          <TrendingUp className="w-3 h-3" />
          Active
        </Badge>
      </div>

      {/* Stat cards */}
      <section aria-label="Summary statistics">
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} loading={false} />
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/teacher/subjects">
              <Plus className="w-4 h-4" />
              Browse Subjects
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <QuickAction key={action.to} {...action} />
          ))}
        </div>
      </section>

      {/* Recent activity placeholder */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            {data?.totalAttempts === 0 || data == null ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Student attempts will appear here once they start practising.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {data.studentsPracticing} student{data.studentsPracticing !== 1 ? 's' : ''} have practised
                    </p>
                    <p className="text-xs text-muted-foreground">{data.totalAttempts} total exam attempts</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs border-emerald-200 text-emerald-700">
                    Avg {data.avgScore ?? 0}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
