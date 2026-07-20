import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, BookOpen, FileText, ClipboardList, BarChart2,
  LogOut, Menu, X, BookMarked, User, Settings, ChevronDown, Rocket
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ─── Navigation structure ─────────────────────────────────────────────────────

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Learning',
    items: [
      { to: '/student/subjects', label: 'Subjects', icon: BookMarked },
      { to: '/student/notes', label: 'Study Notes', icon: FileText },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { to: '/student/practice', label: 'Practice mode', icon: BookOpen },
      { to: '/student/exams', label: 'Mock Exams', icon: ClipboardList },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/student/progress', label: 'My Progress', icon: BarChart2 },
    ],
  },
]

// ─── User Dropdown ────────────────────────────────────────────────────────────

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S'

  return (
    <div className="relative" ref={ref}>
      <button
        id="student-user-dropdown-toggle"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
          {user?.fullName}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden"
          role="menu"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <span className="mt-1 inline-block text-xs font-medium bg-violet-600/10 text-violet-700 px-2 py-0.5 rounded-full">
              Student
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/student/profile"
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile
            </Link>
            <Link
              to="/student/profile"
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              id="student-logout-btn"
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => { setOpen(false); onLogout() }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col',
        'transform transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
          <Rocket className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Exam Prep Ethiopia</p>
          <p className="text-xs text-muted-foreground">Student Portal</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          View Landing Page
        </Link>
      </div>
    </aside>
  )
}

// ─── StudentLayout ────────────────────────────────────────────────────────────

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/student/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          aria-label="Close menu"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="h-16 sticky top-0 z-30 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
          {/* Mobile hamburger */}
          <button
            id="student-sidebar-toggle"
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle sidebar menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Breadcrumb context */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <Rocket className="w-4 h-4 text-violet-600" />
            <span>National Exam Prep Ethiopia</span>
          </div>

          <div className="flex-1" />

          {/* User dropdown */}
          <UserDropdown user={user} onLogout={handleLogout} />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
