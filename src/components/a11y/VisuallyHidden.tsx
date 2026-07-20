import type { ReactNode } from 'react'

/** Visually hidden but available to screen readers. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}
