import { cn } from '@/lib/utils'

/**
 * LoadingSpinner — reusable centered spinner.
 *
 * @param {string} className  - additional classes
 * @param {'sm'|'md'|'lg'} size
 * @param {string} label      - aria-label / visible text
 */
export function LoadingSpinner({ className, size = 'md', label = 'Loading...' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          sizes[size],
          'border-primary border-t-transparent rounded-full animate-spin'
        )}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * FullPageLoader — vertically and horizontally centered, fills the viewport.
 */
export function FullPageLoader({ label }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}
