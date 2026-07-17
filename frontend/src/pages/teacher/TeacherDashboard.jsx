import {
  HelpCircle, FileText, ClipboardList, BarChart2, PlusCircle, TrendingUp
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * Phase 1 stub — Teacher Dashboard.
 * Shows a welcome message and links to future Phase 2 features.
 */
const quickLinks = [
  {
    href: '/teacher/questions',
    label: 'Question Bank',
    description: 'Create and manage exam questions',
    icon: HelpCircle,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/teacher/notes',
    label: 'Study Notes',
    description: 'Upload and manage PDF notes',
    icon: FileText,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    href: '/teacher/exams',
    label: 'Mock Exams',
    description: 'Build and schedule mock exams',
    icon: ClipboardList,
    color: 'bg-teal-100 text-teal-600',
  },
  {
    href: '/teacher/analytics',
    label: 'Analytics',
    description: 'View student performance data',
    icon: BarChart2,
    color: 'bg-violet-100 text-violet-600',
  },
]

export default function TeacherDashboard() {
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
            Manage your questions, notes, and mock exams from here.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs border-emerald-200 text-emerald-700">
          <TrendingUp className="w-3 h-3" />
          Teacher
        </Badge>
      </div>

      {/* Getting started card */}
      <Card className="border-dashed border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Get started</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use the navigation on the left to create questions, upload study notes, and build mock exams for your students.
                Analytics will show you how students are performing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Navigation</h2>
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
        Full functionality (question bank, notes, mock exams, analytics) will be available in Phase 2.
      </p>
    </div>
  )
}
