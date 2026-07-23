import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Users, GraduationCap, LogOut, Menu, X,
  BookOpen, Shield, ChevronDown, Bell, Settings, User, Megaphone, LineChart
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/common/NotificationBell'

const navItems = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
    ],
  },
  {
    label: 'User Management',
    items: [
      { to: '/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/admin/teachers', label: 'Teachers', icon: Users },
    ],
  },
  {
    label: 'System Settings',
    items: [
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
]

// ─── User Dropdown ────────────────────────────────────────────────────────────

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
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
    .toUpperCase() || 'A'

  return (
    <div className="relative" ref={ref}>
      <button
        id="user-dropdown-toggle"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
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
            <span className="mt-1 inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              role="menuitem"
              disabled
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => { setOpen(false) }}
              title="Profile coming soon"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile (Coming Soon)
            </button>
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => { setOpen(false); navigate('/admin/settings'); }}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              id="admin-logout-btn"
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

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
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Exam Prep Ethiopia</p>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navItems.map((group) => (
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
                          ? 'bg-primary text-primary-foreground shadow-sm'
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

      {/* Footer — quick link back to landing */}
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

// ─── AdminLayout ──────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
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
        />
      )}

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation bar */}
        <header className="h-16 sticky top-0 z-30 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
          {/* Mobile hamburger */}
          <button
            id="admin-sidebar-toggle"
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen
              ? <X className="w-5 h-5" />
              : <Menu className="w-5 h-5" />
            }
          </button>

          {/* Page context (desktop only — mirrors sidebar logo on mobile) */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>National Exam Prep Ethiopia</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <NotificationBell />

            {/* User dropdown */}
            <UserDropdown user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
