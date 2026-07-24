import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Reveal a long, already-loaded list in chunks as the user scrolls, so we don't
 * paint hundreds of cards at once. Purely client-side — no extra network calls:
 * the data is already in memory, we just mount more of it on demand.
 *
 * Pass a stable `items` reference (e.g. a query result or a `useMemo`d list) so
 * the visible window doesn't reset on every render. Attach `sentinelRef` to an
 * element at the end of the list; it grows the window when it scrolls into view.
 */
export function useProgressiveReveal<T>(items: T[], step = 8) {
  const [count, setCount] = useState(step)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // New source list (filter switch, refetch) → start from the top again.
  useEffect(() => {
    setCount(step)
  }, [items, step])

  const hasMore = count < items.length
  const visible = useMemo(() => items.slice(0, count), [items, count])

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => c + step)
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, step])

  return { visible, hasMore, sentinelRef }
}
