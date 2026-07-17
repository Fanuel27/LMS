import { BookOpen, Shield, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

/**
 * LandingPage — Phase 1 stub.
 * Renders role-based login buttons so the app is navigable.
 * Phase 2 will replace this with the full public website.
 */
const roles = [
  {
    label: 'Admin Portal',
    description: 'System administration and user management',
    href: '/admin/login',
    icon: Shield,
    color: 'bg-primary text-primary-foreground',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnVariant: 'default',
  },
  {
    label: 'Teacher Portal',
    description: 'Manage questions, notes, and mock exams',
    href: '/teacher/login',
    icon: BookOpen,
    color: 'bg-emerald-600 text-white',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    btnVariant: null, // custom class below
    btnClass: 'w-full bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    label: 'Student Portal',
    description: 'Study notes, practice questions, and mock exams',
    href: '/student/login',
    icon: GraduationCap,
    color: 'bg-violet-600 text-white',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    btnVariant: null,
    btnClass: 'w-full bg-violet-600 hover:bg-violet-700 text-white',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Exam Prep Ethiopia
        </h1>
        <p className="text-muted-foreground mt-2 text-base max-w-sm mx-auto">
          The national Grade 12 exam preparation platform for Ethiopian students.
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map(({ label, description, href, icon: Icon, iconBg, iconColor, btnVariant, btnClass }) => (
          <Card key={href} className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
              {btnVariant ? (
                <Button
                  id={`landing-${label.toLowerCase().replace(' ', '-')}-btn`}
                  variant={btnVariant}
                  className="w-full"
                  onClick={() => (window.location.href = href)}
                >
                  Sign In
                </Button>
              ) : (
                <Button
                  id={`landing-${label.toLowerCase().replace(' ', '-')}-btn`}
                  className={btnClass}
                  onClick={() => (window.location.href = href)}
                >
                  Sign In
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase note */}
      <p className="mt-10 text-xs text-muted-foreground text-center">
        Phase 1 — Authentication &amp; Core Infrastructure complete.{' '}
        <span className="opacity-60">Full public landing page coming in Phase 2.</span>
      </p>
    </div>
  )
}
