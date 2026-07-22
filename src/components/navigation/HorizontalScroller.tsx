import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Horizontal snap-scroll row with a hidden scrollbar and a soft right-edge fade
 * — for card carousels (home Recommended / New rows). Children set their own
 * width (e.g. `w-44 shrink-0 snap-start`).
 */
export function HorizontalScroller({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative -mx-4">
      <div
        className={cn(
          'flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
      >
        {children}
      </div>
      {/* Fade hint that there's more to scroll (decorative). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  )
}
