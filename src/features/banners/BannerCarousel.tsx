import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { Banner } from './types'

interface BannerCarouselProps {
  banners: Banner[]
  /** Auto-advance interval in ms. */
  interval?: number
  className?: string
}

/**
 * Homepage advertisement carousel. Auto-advances when there's more than one
 * banner, pauses on hover/touch, supports swipe + dots, and respects
 * reduced-motion. Renders nothing when there are no live banners.
 */
export function BannerCarousel({ banners, interval = 5000, className }: BannerCarouselProps) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const count = banners.length
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count])

  // Auto-advance.
  useEffect(() => {
    if (count <= 1 || paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval)
    return () => clearInterval(id)
  }, [count, paused, interval])

  // Clamp index if the banner list shrinks.
  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  if (count === 0) return null
  const current = banners[index]

  return (
    <section
      className={cn('relative overflow-hidden rounded-cover shadow-soft', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true)
        touchX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        setPaused(false)
        const start = touchX.current
        const end = e.changedTouches[0]?.clientX ?? null
        if (start !== null && end !== null && Math.abs(end - start) > 40) {
          go(index + (end < start ? 1 : -1))
        }
        touchX.current = null
      }}
      aria-roledescription="carousel"
      aria-label="Promotions"
    >
      <div className="relative aspect-[16/6] w-full bg-surface-muted">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <BannerSlide banner={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/** One banner image, linked when it has a destination. */
function BannerSlide({ banner }: { banner: Banner }) {
  const img = (
    <img
      src={banner.imageUrl ?? ''}
      alt={banner.title}
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
    />
  )

  if (!banner.linkUrl) return img

  // Absolute URLs open externally; internal paths use the router.
  if (/^https?:\/\//i.test(banner.linkUrl)) {
    return (
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block size-full">
        {img}
      </a>
    )
  }
  return (
    <Link to={banner.linkUrl} className="block size-full">
      {img}
    </Link>
  )
}
