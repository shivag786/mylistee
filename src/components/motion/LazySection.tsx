import { useEffect, useRef, useState, type ReactNode } from 'react'

interface LazySectionProps {
  children: ReactNode
  /** Reserved height (px) before the section mounts, so scroll position is stable. */
  minHeight?: number
  /** How far ahead of the viewport to start loading. */
  rootMargin?: string
}

/**
 * Defers mounting (and therefore data fetching) of a below-the-fold homepage
 * section until it scrolls near the viewport. The hero + first rows paint
 * immediately; everything else loads as the user scrolls — no wasted network
 * or render for sections the user never reaches (document/phase/03 §Performance).
 */
export function LazySection({ children, minHeight = 220, rootMargin = '400px 0px' }: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (show) return
    const el = ref.current
    if (!el) return

    // Older browsers without IntersectionObserver: render immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [show, rootMargin])

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  )
}
