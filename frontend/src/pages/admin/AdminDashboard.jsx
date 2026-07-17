import { useQuery } from '@tanstack/react-query'
import {
  GraduationCap, Users, BookOpen, HelpCircle, FileText, ClipboardList,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/user.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * Stat card widget for the admin dashboard.
 */
function StatCard({ title, value, icon: Icon, color, isLoading }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">
                {value?.toLocaleString() ?? '—'}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await userService.getStats()
      return res.data.data
    },
  })

  const stats = [
    {
      title: 'Total Students',
      value: data?.students,
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Teachers',
      value: data?.teachers,
      icon: Users,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Subjects',
      value: data?.subjects,
      icon: BookOpen,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Questions',
      value: data?.questions,
      icon: HelpCircle,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Study Notes',
      value: data?.notes,
      icon: FileText,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'Mock Exams',
      value: data?.mockExams,
      icon: ClipboardList,
      color: 'bg-teal-100 text-teal-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's an overview of the platform activity.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <TrendingUp className="w-3 h-3" />
          Admin
        </Badge>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load platform statistics. Please refresh the page.
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} isLoading={isLoading} />
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/admin/students">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Manage Students</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or deactivate students</p>
                </div>
              </CardContent>
            </Card>
          </a>
          <a href="/admin/teachers">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Manage Teachers</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or deactivate teachers</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </div>
    </div>
  )
}
