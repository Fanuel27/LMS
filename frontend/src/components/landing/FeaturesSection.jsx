import {
  GraduationCap, BookOpen, Shield,
  BookMarked, ClipboardCheck, Timer, BarChart2, Download,
  Upload, HelpCircle, ClipboardList, Users,
  TrendingUp, Award
} from 'lucide-react'

const audienceGroups = [
  {
    id: 'students',
    icon: GraduationCap,
    title: 'For Students',
    tagline: 'Everything you need to pass with flying colors',
    color: 'from-violet-500 to-blue-500',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    features: [
      { icon: HelpCircle, label: 'Unlimited Practice Questions', desc: 'Subject-specific questions from past papers' },
      { icon: Timer, label: 'Timed Mock Exams', desc: 'Simulate real exam pressure with time limits' },
      { icon: ClipboardCheck, label: 'Instant Feedback', desc: 'Know right away what you got right or wrong' },
      { icon: BarChart2, label: 'Performance Tracking', desc: 'See your progress across all subjects over time' },
      { icon: Download, label: 'Download Study Notes', desc: 'Access teacher-uploaded PDF notes any time' },
    ],
  },
  {
    id: 'teachers',
    icon: BookOpen,
    title: 'For Teachers',
    tagline: 'Powerful tools to guide your students to success',
    color: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    features: [
      { icon: Upload, label: 'Upload Study Notes', desc: 'Share PDF notes directly with enrolled students' },
      { icon: HelpCircle, label: 'Create Questions', desc: 'Build a rich question bank by subject and topic' },
      { icon: ClipboardList, label: 'Build Mock Exams', desc: 'Assemble and schedule timed practice exams' },
      { icon: BarChart2, label: 'Track Student Performance', desc: 'See how each student is improving over time' },
    ],
  },
  {
    id: 'schools',
    icon: Shield,
    title: 'For Schools',
    tagline: "Centralized oversight of your institution's exam readiness",
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    features: [
      { icon: Users, label: 'Manage Teachers & Students', desc: 'Onboard and organize staff and learners easily' },
      { icon: TrendingUp, label: 'Monitor Exam Readiness', desc: 'Dashboard-level visibility into cohort performance' },
      { icon: Award, label: 'Improve Pass Rates', desc: 'Data-driven interventions to raise national exam results' },
      { icon: BookMarked, label: 'Subject-Level Insights', desc: 'Identify weak subjects before the exam season' },
    ],
  },
]

function FeatureCard({ icon: Icon, label, desc }) {
  return (
    <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/60 transition-colors">
      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </li>
  )
}

function AudienceCard({ icon: Icon, title, tagline, color, iconBg, iconColor, badgeBg, features }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card header gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <span className={`inline-block text-xs font-semibold border rounded-full px-2.5 py-0.5 ${badgeBg}`}>
              {title}
            </span>
          </div>
        </div>
        <p className="text-base font-semibold text-foreground mt-3">{tagline}</p>
        <ul className="mt-4 space-y-1">
          {features.map((f) => (
            <FeatureCard key={f.label} {...f} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            One Platform, Three Powerful Portals
          </h2>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed">
            Built for every stakeholder in the exam preparation journey — students who need to
            learn, teachers who need to teach, and schools that need to manage.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {audienceGroups.map((group) => (
            <AudienceCard key={group.id} {...group} />
          ))}
        </div>
      </div>
    </section>
  )
}
