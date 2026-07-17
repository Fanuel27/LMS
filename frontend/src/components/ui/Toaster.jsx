import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/Toast'

/**
 * Toaster — renders active toasts from a passed list.
 * Wrap your layout or app root with this component.
 *
 * Usage:
 *   const { toasts, toast } = useToast()
 *   ...
 *   <Toaster toasts={toasts} />
 */
export function Toaster({ toasts = [] }) {
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
