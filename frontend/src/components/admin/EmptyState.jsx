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
      <div className="w-16 h-16 bg-muted/70 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
        <Icon className="w-8 h-8 text-muted-foreground/70" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
