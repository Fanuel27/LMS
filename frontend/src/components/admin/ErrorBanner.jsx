import { AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

/**
 * ErrorBanner — inline error message with optional retry.
 *
 * @param {string}   message
 * @param {function} onRetry  – If provided, shows a Retry button
 * @param {string}   className
 */
export default function ErrorBanner({ message, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl bg-destructive/8 border border-destructive/20 border-l-4 border-l-destructive text-destructive',
        className
      )}
    >
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">
          {message || 'Something went wrong. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 gap-1.5 -mr-1"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
