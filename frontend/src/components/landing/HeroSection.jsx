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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-100/50 rounded-full blur-3xl opacity-50" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-xs text-blue-700 font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Built for Ethiopian Grade 12 Students
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Ace Your{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  National Exam
                </span>{' '}
                with Confidence
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed font-medium">
                Ethiopia's leading Grade 12 exam preparation platform. Practice, learn, and
                track your progress with tools built specifically for the Ethiopian curriculum.
              </p>
            </div>

            {/* Bullet points */}
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
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
                  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Start as Student
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/teacher/login">
                <Button
                  id="hero-teacher-login"
                  size="lg"
                  variant="outline"
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Teacher Portal
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button
                  id="hero-admin-login"
                  size="lg"
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium pt-2">
              <div className="flex -space-x-2">
                {['bg-emerald-100 border-emerald-300', 'bg-blue-100 border-blue-300', 'bg-violet-100 border-violet-300', 'bg-amber-100 border-amber-300'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 relative z-[${4-i}] shadow-sm flex items-center justify-center`} />
                ))}
              </div>
              <span>Trusted by students across Ethiopia</span>
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative hidden lg:block">
            {/* Main dashboard card - Kept dark for premium contrast */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-900/20">
              {/* Header bar */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="flex-1 mx-3 h-6 bg-slate-800 rounded-md" />
              </div>

              {/* Mock stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Score', value: '87%', color: 'text-emerald-400' },
                  { label: 'Questions', value: '240', color: 'text-blue-400' },
                  { label: 'Rank', value: '#12', color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* Mock progress bars */}
              <div className="space-y-4">
                {[
                  { subject: 'Mathematics', pct: 92, color: 'bg-blue-500' },
                  { subject: 'Physics', pct: 78, color: 'bg-emerald-500' },
                  { subject: 'Chemistry', pct: 65, color: 'bg-amber-500' },
                  { subject: 'Biology', pct: 88, color: 'bg-violet-500' },
                ].map(({ subject, pct, color }) => (
                  <div key={subject}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                      <span>{subject}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock recent activity */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Recent Activity</p>
                {[
                  { text: 'Completed Math Mock Exam', score: '9/10', icon: BarChart2 },
                  { text: 'Practiced Physics Questions', score: '23 Qs', icon: CheckCircle2 },
                ].map(({ text, score, icon: Icon }) => (
                  <div key={text} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="flex-1 text-sm text-slate-300 font-medium">{text}</p>
                    <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-md">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-white border border-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Top Performer
            </div>

            {/* Floating subject card */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xl w-56">
              <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Next Mock Exam</p>
              <p className="text-sm text-slate-900 font-bold">Physics — Chapter 5</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs text-amber-600 font-medium">Starts in 2 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
