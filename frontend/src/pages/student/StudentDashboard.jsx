import {
  BookOpen, ClipboardList, BarChart2, FileText, Sparkles, TrendingUp
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * Phase 1 stub — Student Dashboard.
 * Shows a welcome message and links to future Phase 2 features.
 */
const quickLinks = [
  {
    href: '/student/notes',
    label: 'Study Notes',
    description: 'Browse subject notes uploaded by teachers',
    icon: FileText,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    href: '/student/practice',
    label: 'Practice Questions',
    description: 'Practice with subject-specific questions',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/student/exams',
    label: 'Mock Exams',
    description: 'Take timed mock exams',
    icon: ClipboardList,
    color: 'bg-violet-100 text-violet-600',
  },
  {
    href: '/student/progress',
    label: 'My Progress',
    description: 'Track your scores and improvement',
    icon: BarChart2,
    color: 'bg-teal-100 text-teal-600',
  },
]

export default function StudentDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep studying — your Grade 12 exam is within reach!
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs border-violet-200 text-violet-700">
          <TrendingUp className="w-3 h-3" />
          Student
        </Badge>
      </div>

      {/* Motivational card */}
      <Card className="border-dashed border-violet-200 bg-violet-50/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Start preparing today!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Practice questions, study notes, and timed mock exams are all here to help you
                ace the Ethiopian Grade 12 National Exam. Consistent practice is the key to success.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Start Studying</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, description, icon: Icon, color }) => (
            <a key={href} href={href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Phase note */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Full functionality (practice, mock exams, progress tracking) will be available in Phase 2.
      </p>
    </div>
  )
}
