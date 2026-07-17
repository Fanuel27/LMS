import { Shield, BookOpen, GraduationCap, BarChart2, Users, ClipboardList } from 'lucide-react'

// ─── Mock dashboard data ────────────────────────────────────────────────────

const adminPreview = {
  title: 'Admin Dashboard',
  role: 'ADMIN',
  color: 'from-blue-600 to-blue-700',
  badgeBg: 'bg-blue-100 text-blue-700',
  icon: Shield,
  stats: [
    { label: 'Students', value: '1,240', color: 'text-blue-500' },
    { label: 'Teachers', value: '48', color: 'text-emerald-500' },
    { label: 'Subjects', value: '10', color: 'text-violet-500' },
    { label: 'Questions', value: '4,500', color: 'text-amber-500' },
  ],
  rows: [
    { label: 'New Registrations', value: '12 today' },
    { label: 'Exams Scheduled', value: '3 active' },
    { label: 'Avg. Pass Rate', value: '74%' },
  ],
}

const teacherPreview = {
  title: 'Teacher Dashboard',
  role: 'TEACHER',
  color: 'from-emerald-600 to-teal-600',
  badgeBg: 'bg-emerald-100 text-emerald-700',
  icon: BookOpen,
  stats: [
    { label: 'My Questions', value: '320', color: 'text-amber-500' },
    { label: 'Study Notes', value: '18', color: 'text-pink-500' },
    { label: 'Mock Exams', value: '5', color: 'text-teal-500' },
    { label: 'Students', value: '87', color: 'text-blue-500' },
  ],
  rows: [
    { label: 'Last Upload', value: 'Physics Ch.3 PDF' },
    { label: 'Top Student Score', value: '95%' },
    { label: 'Exam Attempts', value: '143 this week' },
  ],
}

const studentPreview = {
  title: 'Student Dashboard',
  role: 'STUDENT',
  color: 'from-violet-600 to-purple-600',
  badgeBg: 'bg-violet-100 text-violet-700',
  icon: GraduationCap,
  stats: [
    { label: 'Questions Done', value: '240', color: 'text-blue-500' },
    { label: 'Avg. Score', value: '82%', color: 'text-emerald-500' },
    { label: 'Exams Taken', value: '9', color: 'text-violet-500' },
    { label: 'Study Hours', value: '34h', color: 'text-amber-500' },
  ],
  rows: [
    { label: 'Best Subject', value: 'Biology — 94%' },
    { label: 'Needs Work', value: 'Chemistry — 61%' },
    { label: 'Next Exam', value: 'Math Mock in 2 days' },
  ],
}

// ─── Preview Card ────────────────────────────────────────────────────────────

function PreviewCard({ title, role, color, badgeBg, icon: Icon, stats, rows }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
      {/* Header */}
      <div className={`bg-gradient-to-r ${color} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">{title}</span>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeBg}`}>{role}</span>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ label, value, color: c }) => (
            <div key={label} className="bg-white/15 rounded-xl p-3">
              <p className={`text-lg font-bold text-white`}>{value}</p>
              <p className="text-xs text-white/70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body rows */}
      <div className="p-5 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">{value}</span>
          </div>
        ))}
        {/* Skeleton bar to fill space */}
        <div className="pt-2 space-y-2">
          <div className="h-2 bg-muted rounded-full w-full" />
          <div className="h-2 bg-muted rounded-full w-4/5" />
          <div className="h-2 bg-muted rounded-full w-3/5" />
        </div>
      </div>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

export default function PreviewSection() {
  return (
    <section id="preview" className="py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Platform Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            See the Platform in Action
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Three dedicated dashboards — purpose-built for Admins, Teachers, and Students.
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PreviewCard {...adminPreview} />
          <PreviewCard {...teacherPreview} />
          <PreviewCard {...studentPreview} />
        </div>

        {/* Supporting labels */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { Icon: Shield, label: 'Manage your entire institution', color: 'text-blue-500' },
            { Icon: ClipboardList, label: 'Create and manage content', color: 'text-emerald-500' },
            { Icon: Users, label: 'Study smarter, not harder', color: 'text-violet-500' },
          ].map(({ Icon, label, color }) => (
            <div key={label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
