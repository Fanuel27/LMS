import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, BookOpen, Target, FileText, 
  ArrowRight, Activity, Award, CheckCircle2,
  BookMarked
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { studentService } from '@/services/student.service'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: statsData, isLoading, isError, error } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const res = await studentService.getStats()
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader 
          title={`Welcome back, ${user?.fullName?.split(' ')[0]}! 👋`} 
          description="Here's an overview of your learning progress."
        />
        <CardGridSkeleton count={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader title="Dashboard" description="Overview of your learning progress." />
        <ErrorBanner message={error?.response?.data?.message || 'Failed to load statistics'} />
      </div>
    )
  }

  const {
    practiceAttempts,
    mockExamsTaken,
    avgScore,
    bestScore,
    notesAvailable,
    availableMockExams,
    subjectsAvailable,
    recentActivity
  } = statsData

  const statCards = [
    {
      title: 'Practice Attempts',
      value: practiceAttempts,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Mock Exams Taken',
      value: mockExamsTaken,
      icon: ClipboardList,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
    },
    {
      title: 'Average Score',
      value: `${avgScore}%`,
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Best Score',
      value: `${bestScore}%`,
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title={`Welcome back, ${user?.fullName?.split(' ')[0]}! 👋`} 
        description="Ready to crush your national exams? Here is your study overview."
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions & Available Resources */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <CardTitle className="text-lg">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <Link to="/student/subjects" className="group p-4 border border-border rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors block text-center">
                  <div className="w-10 h-10 mx-auto bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Subjects</h3>
                  <p className="text-xs text-muted-foreground">{subjectsAvailable} Subjects Available</p>
                </Link>

                <Link to="/student/exams" className="group p-4 border border-border rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors block text-center">
                  <div className="w-10 h-10 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Mock Exams</h3>
                  <p className="text-xs text-muted-foreground">{availableMockExams} Active Exams</p>
                </Link>

                <Link to="/student/notes" className="group p-4 border border-border rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors block text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Study Notes</h3>
                  <p className="text-xs text-muted-foreground">{notesAvailable} PDFs to Read</p>
                </Link>

              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg overflow-hidden relative">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
            <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to test your knowledge?</h3>
                <p className="text-violet-100 max-w-md">
                  Jump straight into practice mode and improve your scores through targeted question drills.
                </p>
              </div>
              <Link 
                to="/student/practice" 
                className="shrink-0 bg-white text-violet-700 hover:bg-violet-50 font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                Start Practice <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[400px] custom-scrollbar">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take a practice test or mock exam to see your history here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="p-4 hover:bg-accent/40 transition-colors flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.mockExam?.title || 'Practice Session'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.mockExam?.subject?.name || 'General'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Score: {activity.score}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(activity.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
