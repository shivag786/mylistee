import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { Heart, Navigation } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatDistance } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useTilt } from '@/features/businesses/hooks/useTilt'
import type { HeroDish } from './homeService'

/** How long each dish stays in front before the ring turns. */
const AUTOPLAY_MS = 4000

/** Wrap a ring offset into -n/2..n/2 so cards come round the shortest way. */
function offsetOf(index: number, active: number, count: number): number {
  let d = index - active
  if (d > count / 2) d -= count
  if (d < -count / 2) d += count
  return d
}

/**
 * Home hero: dishes on a 3D ring (coverflow). The front dish sets the whole
 * hero's colour wash; the ring turns by itself, by swipe, or by tapping a side
 * card, and the stage leans with the phone. Tapping the front dish opens it at
 * its shop. `header` (greeting, coins) sits over the top.
 */
export function HeroCarousel3D({ dishes, header }: { dishes: HeroDish[]; header: ReactNode }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const tilt = useTilt(true)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = dishes.length
  const current = dishes[Math.min(active, count - 1)]

  useEffect(() => {
    if (reduce || paused || count < 2) return
    const t = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [reduce, paused, count])

  // Resume autoplay a while after the last touch.
  useEffect(() => {
    if (!paused) return
    const t = setTimeout(() => setPaused(false), AUTOPLAY_MS * 2)
    return () => clearTimeout(t)
  }, [paused, active])

  function go(to: number) {
    setPaused(true)
    setActive(((to % count) + count) % count)
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -40 || info.velocity.x < -300) go(active + 1)
    else if (info.offset.x > 40 || info.velocity.x > 300) go(active - 1)
  }

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-secondary text-white shadow-premium">
      {/* Colour wash from the front dish */}
      <AnimatePresence initial={false}>
        {current?.imageUrl && (
          <motion.img
            key={current.id}
            src={current.imageUrl}
            alt=""
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0 size-full scale-150 object-cover blur-3xl saturate-150"
          />
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/55" />

      <div className="relative px-4 pt-5">{header}</div>

      {/* The ring */}
      <motion.div
        className="relative mt-2 h-[17.5rem] touch-pan-y [perspective:1100px]"
        drag={count > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={onDragEnd}
        {...tilt.bind}
      >
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          style={reduce ? undefined : { rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        >
          {dishes.map((dish, i) => {
            const d = offsetOf(i, active, count)
            const far = Math.abs(d)
            const front = d === 0
            return (
              <motion.button
                key={dish.id}
                type="button"
                aria-label={front ? `Open ${dish.name} at ${dish.business.name}` : `Show ${dish.name}`}
                tabIndex={far > 1 ? -1 : 0}
                onClick={() =>
                  front
                    ? navigate(`${ROUTES.businessProfile(dish.business.slug)}?item=${dish.id}`)
                    : go(i)
                }
                initial={false}
                animate={{
                  x: `calc(-50% + ${d * 58}%)`,
                  rotateY: reduce ? 0 : d * -38,
                  z: reduce ? 0 : -far * 150,
                  scale: 1 - Math.min(far, 3) * 0.1,
                  opacity: far > 2 ? 0 : 1 - far * 0.2,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                style={{ zIndex: 10 - far }}
                className={cn(
                  'absolute left-1/2 top-2 w-[11.5rem] overflow-hidden rounded-[1.6rem] bg-black/20 text-left shadow-2xl ring-1 ring-white/20 [backface-visibility:hidden]',
                  far > 2 && 'pointer-events-none',
                )}
              >
                {dish.imageUrl && (
                  <img src={dish.imageUrl} alt="" draggable={false} loading={far <= 1 ? 'eager' : 'lazy'} className="aspect-[4/5] w-full object-cover" />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 pt-10">
                  {dish.label && (
                    <span className="mb-1 inline-block rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold text-gold-foreground">
                      {dish.label}
                    </span>
                  )}
                  <span className="line-clamp-2 block text-caption font-bold leading-tight">{dish.name}</span>
                  <span className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-body font-black">₹{dish.price}</span>
                    {dish.strikePrice != null && (
                      <span className="text-small text-white/60 line-through">₹{dish.strikePrice}</span>
                    )}
                  </span>
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Front dish's shop + position */}
      <div className="relative flex items-center justify-between gap-3 px-4 pb-4 pt-1">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex min-w-0 items-center gap-2 text-caption"
            >
              {current.business.logoUrl && (
                <img src={current.business.logoUrl} alt="" className="size-6 shrink-0 rounded-full bg-white object-cover ring-1 ring-white/50" />
              )}
              <span className="truncate font-semibold">{current.business.name}</span>
              {current.business.isFollowed && <Heart className="size-3.5 shrink-0 fill-current text-white" aria-label="Following" />}
              {current.business.distanceMeters != null && (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-white/75">
                  <Navigation className="size-3" aria-hidden /> {formatDistance(current.business.distanceMeters)}
                </span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
        {count > 1 && (
          <span className="flex shrink-0 gap-1" aria-hidden>
            {dishes.map((d, i) => (
              <span key={d.id} className={cn('h-1.5 rounded-full bg-white transition-all', i === active ? 'w-4' : 'w-1.5 opacity-40')} />
            ))}
          </span>
        )}
      </div>
    </section>
  )
}
