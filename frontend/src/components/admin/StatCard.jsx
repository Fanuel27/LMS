import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

/**
 * StatCard — a single metric tile for the admin dashboard.
 *
 * @param {string}          title
 * @param {number|string}   value
 * @param {React.ElementType} icon
 * @param {string}          iconBg      – Tailwind bg+text classes for the icon wrapper
 * @param {string}          trend       – optional label like '+12 this week'
 * @param {boolean}         isLoading
 * @param {function}        onClick
 */
export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-primary/10 text-primary',
  trend,
  isLoading = false,
  onClick,
}) {
  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {title}
        </p>

        {isLoading ? (
          <div className="mt-2 h-8 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
            {value?.toLocaleString() ?? '—'}
          </p>
        )}

        {trend && !isLoading && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>

      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}
