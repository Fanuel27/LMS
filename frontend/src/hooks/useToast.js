import { useState, useCallback } from 'react'

let toastCount = 0

/**
 * Minimal useToast hook — manages a queue of toasts.
 * Used by login pages and any component that needs toast notifications.
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = ++toastCount
    setToasts((prev) => [...prev, { id, title, description, variant, open: true }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, open: false } : t))
      )
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t))
    )
  }, [])

  return { toasts, toast, dismiss }
}
