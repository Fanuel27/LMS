import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Shield, Mail, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const navSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Platform Preview', href: '#preview' },
      { label: 'Why Choose Us', href: '#why-us' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Student Login', href: '/student/login', internal: true },
      { label: 'Teacher Login', href: '/teacher/login', internal: true },
      { label: 'Admin Login', href: '/admin/login', internal: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
]

const scrollTo = (href) => {
  const el = document.querySelector(href)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      {/* CTA band */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Ready to get started?
              </h2>
              <p className="text-slate-400 mt-1 text-sm">
                Join schools across Ethiopia already using our platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/student/login">
                <Button
                  id="footer-student-login"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Login
                </Button>
              </Link>
              <Link to="/teacher/login">
                <Button
                  id="footer-teacher-login"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BookOpen className="w-4 h-4" />
                  Teacher Login
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button id="footer-admin-login" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Shield className="w-4 h-4" />
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-white text-sm">
                Exam Prep<span className="text-primary"> Ethiopia</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Ethiopia's national Grade 12 exam preparation platform. Built for students,
              teachers, and schools.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>contact@examprep.et</span>
            </div>
          </div>

          {/* Nav columns */}
          {navSections.map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{title}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href, internal }) => (
                  <li key={label}>
                    {internal ? (
                      <Link
                        to={href}
                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {label}
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </Link>
                    ) : href.startsWith('#') ? (
                      <button
                        onClick={() => scrollTo(href)}
                        className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                      >
                        {label}
                      </button>
                    ) : (
                      <a
                        href={href}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Exam Prep Ethiopia. All rights reserved.</p>
          <p>
            Made with ❤️ for Ethiopian students, teachers, and schools.
          </p>
        </div>
      </div>
    </footer>
  )
}
