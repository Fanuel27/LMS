import { useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * ConfirmDialog — modal confirmation before destructive actions.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm()
 *   await confirm({ title: '…', description: '…', confirmLabel: 'Delete' })
 *   <ConfirmDialog />
 */

export function useConfirm() {
  const [state, setState] = useState(null)
  // state = { title, description, confirmLabel, variant, resolve }

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve })
    })
  }, [])

  const handleChoice = useCallback((result) => {
    state?.resolve(result)
    setState(null)
  }, [state])

  const Dialog = useCallback(() => {
    if (!state) return null
    return (
      <ConfirmDialog
        open
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        variant={state.variant}
        onConfirm={() => handleChoice(true)}
        onCancel={() => handleChoice(false)}
      />
    )
  }, [state, handleChoice])

  return { confirm, ConfirmDialog: Dialog }
}

/**
 * ConfirmDialog (controlled) — use directly when not using the hook.
 */
export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        className="relative z-10 bg-card border border-border rounded-2xl shadow-xl p-6 max-w-sm w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            variant === 'destructive' ? 'bg-destructive/10' : 'bg-amber-100'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5',
              variant === 'destructive' ? 'text-destructive' : 'text-amber-600'
            )} />
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
