import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names safely with Tailwind conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
