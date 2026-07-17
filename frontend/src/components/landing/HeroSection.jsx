import { Link } from 'react-router-dom'
import {
  GraduationCap, BookOpen, BarChart2, CheckCircle2, ArrowRight,
  Sparkles, Star, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { value: '50+', label: 'Practice Questions' },
  { value: '10', label: 'Core Subjects' },
  { value: '3', label: 'User Roles' },
  { value: '100%', label: 'Free to Use' },
]

const bullets = [
  'Aligned with the Ethiopian Grade 12 national curriculum',
  'Unlimited practice questions with instant feedback',
  'Timed mock exams that mirror the real exam format',
  'Performance analytics to track your progress',
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs text-blue-200 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Built for Ethiopian Grade 12 Students
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Ace Your{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  National Exam
                </span>{' '}
                with Confidence
              </h1>
              <p className="text-lg text-blue-100/80 max-w-lg leading-relaxed">
                Ethiopia's leading Grade 12 exam preparation platform. Practice, learn, and
                track your progress with tools built specifically for the Ethiopian curriculum.
              </p>
            </div>

            {/* Bullet points */}
            <ul className="space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-blue-100/70">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link to="/student/login">
                <Button
                  id="hero-student-login"
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-blue-50 font-semibold shadow-lg shadow-white/10"
                >
                  <GraduationCap className="w-4 h-4" />
                  Start as Student
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/teacher/login">
                <Button
                  id="hero-teacher-login"
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent"
                >
                  <BookOpen className="w-4 h-4" />
                  Teacher Portal
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button
                  id="hero-admin-login"
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white bg-transparent"
                >
                  <Shield className="w-4 h-4" />
                  Admin Login
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-2 text-sm text-blue-200/60">
              <div className="flex -space-x-1">
                {['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500'].map((c, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-slate-900`} />
                ))}
              </div>
              <span>Trusted by students across Ethiopia</span>
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative hidden lg:block">
            {/* Main dashboard card */}
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              {/* Header bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-3 h-6 bg-white/10 rounded-md" />
              </div>

              {/* Mock stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Score', value: '87%', color: 'text-emerald-400' },
                  { label: 'Questions', value: '240', color: 'text-blue-400' },
                  { label: 'Rank', value: '#12', color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/50 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Mock progress bars */}
              <div className="space-y-3">
                {[
                  { subject: 'Mathematics', pct: 92, color: 'bg-blue-400' },
                  { subject: 'Physics', pct: 78, color: 'bg-emerald-400' },
                  { subject: 'Chemistry', pct: 65, color: 'bg-amber-400' },
                  { subject: 'Biology', pct: 88, color: 'bg-violet-400' },
                ].map(({ subject, pct, color }) => (
                  <div key={subject}>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>{subject}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock recent activity */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Recent Activity</p>
                {[
                  { text: 'Completed Math Mock Exam', score: '9/10', icon: BarChart2 },
                  { text: 'Practiced Physics Questions', score: '23 Qs', icon: CheckCircle2 },
                ].map(({ text, score, icon: Icon }) => (
                  <div key={text} className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-white/60" />
                    </div>
                    <p className="flex-1 text-xs text-white/60">{text}</p>
                    <span className="text-xs text-blue-400 font-medium">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              Top Performer
            </div>

            {/* Floating subject card */}
            <div className="absolute -bottom-6 -left-6 bg-white/15 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl w-48">
              <p className="text-xs text-white/50 mb-1">Next Mock Exam</p>
              <p className="text-sm text-white font-semibold">Physics — Chapter 5</p>
              <p className="text-xs text-amber-400 mt-1">Starts in 2 hours</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 pt-8 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-blue-200/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
