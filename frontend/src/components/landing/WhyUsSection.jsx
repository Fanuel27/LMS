import {
  MapPin, BarChart2, Layers, MousePointerClick, Sparkles, Globe
} from 'lucide-react'

const benefits = [
  {
    icon: MapPin,
    title: 'Ethiopian Curriculum Focused',
    description:
      'Every question, subject, and mock exam is tailored to the Ethiopian Grade 12 national curriculum — nothing generic, nothing wasted.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: Globe,
    title: 'National Exam Preparation',
    description:
      'Specifically designed to prepare students for the Ethiopian University Entrance Examination — the most important test of their academic career.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: BarChart2,
    title: 'Progress Analytics',
    description:
      'Detailed performance tracking at the question, subject, and exam level — for students, teachers, and administrators.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: MousePointerClick,
    title: 'Easy to Use',
    description:
      'Intuitive interfaces designed for students with varying levels of digital literacy. No training required — just log in and start learning.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Sparkles,
    title: 'Modern Interface',
    description:
      'A professional, responsive design that works beautifully on phones, tablets, and computers — wherever students choose to study.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Layers,
    title: 'All Subjects Covered',
    description:
      'Mathematics, Physics, Chemistry, Biology, English, and more — all Grade 12 core subjects in a single platform.',
    color: 'bg-teal-100 text-teal-600',
  },
]

export default function WhyUsSection() {
  return (
    <section id="why-us" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Why Choose Us</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Built Specifically for Ethiopia
          </h2>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed">
            Unlike generic learning platforms, every feature of Exam Prep Ethiopia exists
            for one reason: helping Ethiopian Grade 12 students pass their national exam.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
