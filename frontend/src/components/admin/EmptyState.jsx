import { InboxIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * EmptyState — shown when a list / table has no rows.
 *
 * @param {React.ElementType} icon     – Lucide icon (defaults to InboxIcon)
 * @param {string}            title
 * @param {string}            description
 * @param {React.ReactNode}   action   – Optional CTA button
 * @param {string}            className
 */
export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
