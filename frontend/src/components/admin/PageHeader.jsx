/**
 * PageHeader — consistent title + breadcrumb row for every admin page.
 *
 * @param {string}              title         – Page heading
 * @param {string}              description   – Subtitle / helper text
 * @param {Array<{label,href}>} breadcrumbs   – Parent links before the page title
 * @param {React.ReactNode}     actions       – Slot for buttons on the right
 */
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PageHeader({ title, description, breadcrumbs = [], actions, className }) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map(({ label, href }, i) => (
            <span key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <Link
                to={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            </span>
          ))}
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
