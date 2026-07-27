import { cn } from '@/lib/utils'

/**
 * LoadingSkeleton — animated grey placeholder block.
 *
 * @param {string} className  – Tailwind width/height overrides
 * @param {'text'|'circle'|'rect'} variant
 */
export function LoadingSkeleton({ className, variant = 'rect' }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded-md',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        className
      )}
    />
  )
}

/**
 * TableSkeleton — skeleton for a data table with N rows.
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-0 rounded-lg border border-border overflow-hidden">
      {/* Header row */}
      <div
        className="grid gap-4 px-4 py-3 bg-muted/40 border-b border-border"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <LoadingSkeleton key={c} variant="text" className="h-3 w-16" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            'grid gap-4 px-4 py-3.5',
            r < rows - 1 && 'border-b border-border'
          )}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <LoadingSkeleton
              key={c}
              variant="text"
              className={cn(c === 0 ? 'w-3/4' : c === cols - 1 ? 'w-1/2' : 'w-full')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * CardGridSkeleton — grid of stat card skeletons.
 */
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <LoadingSkeleton variant="text" className="w-28 h-3" />
            <LoadingSkeleton className="w-16 h-8 rounded-lg" />
          </div>
          <LoadingSkeleton variant="circle" className="w-11 h-11 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * FormSkeleton — skeleton for a form with N fields.
 */
export function FormSkeleton({ fields = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton variant="text" className="w-24 h-3" />
          <LoadingSkeleton className="w-full h-10 rounded-lg" />
        </div>
      ))}
      <LoadingSkeleton className="w-28 h-9 rounded-lg ml-auto" />
    </div>
  )
}

