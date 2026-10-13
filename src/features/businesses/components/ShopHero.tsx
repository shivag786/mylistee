import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Star, Users } from 'lucide-react'
import { ExpandableText } from '@/components/data/ExpandableText'
import { staggerContainer, staggerItem } from '@/animations'
import { cn } from '@/utils/cn'
import { formatClockTime as formatTime } from '@/utils/format'
import type { PublicBusiness } from '../publicTypes'

/**
 * Top of a shop's page: cover with a gentle parallax, the logo overlapping its
 * edge, then name, live open/closed status and the shop's numbers. Anything the
 * shop hasn't filled in is left out rather than shown empty.
 */
export function ShopHero({ business, actions }: { business: PublicBusiness; actions?: ReactNode }) {
  const reduce = useReducedMotion()
  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const coverScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  const initial = business.name.trim().charAt(0).toUpperCase() || '?'
  const hasHours = Boolean(business.openingTime && business.closingTime)
  const allDay = hasHours && business.openingTime === business.closingTime

  return (
    <div>
      {/* Cover */}
      <div ref={coverRef} className="relative h-48 overflow-hidden rounded-cover bg-surface-muted shadow-soft sm:h-56">
        {business.coverUrl ? (
          <motion.img
            src={business.coverUrl}
            alt=""
            initial={reduce ? false : { scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
            style={reduce ? undefined : { y: coverY, scale: coverScale }}
            className="size-full object-cover"
          />
        ) : (
          // No cover: a warm gradient with the shop's initial, not a grey box.
          <div className="relative size-full bg-gradient-to-br from-gradient-from via-gradient-from/80 to-gradient-to">
            <span className="absolute -bottom-10 -right-4 select-none text-[10rem] font-black leading-none text-white/15" aria-hidden>
              {initial}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      <motion.div
        className="space-y-2 px-1"
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo over the cover's edge, actions to its right */}
        <div className="-mt-9 flex items-start justify-between gap-3">
          <motion.div
            variants={staggerItem}
            className="relative grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-background bg-surface shadow-floating"
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-title font-black text-primary">{initial}</span>
            )}
          </motion.div>
          {/* Pushed below the cover's edge so it never sits on the photo. */}
          {actions && <motion.div variants={staggerItem} className="pt-11">{actions}</motion.div>}
        </div>

        <motion.div variants={staggerItem} className="space-y-1">
          <h1 className="text-subtitle font-bold leading-tight text-foreground">{business.name}</h1>
          {business.category && <p className="text-caption font-medium text-text-secondary">{business.category}</p>}
        </motion.div>

        <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption">
          {hasHours && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold',
                business.isOpen ? 'bg-success-soft text-success' : 'bg-destructive-soft text-destructive',
              )}
            >
              <span className="relative flex size-2">
                {business.isOpen && !reduce && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
                )}
                <span className="relative inline-flex size-2 rounded-full bg-current" />
              </span>
              {allDay
                ? 'Open 24 hours'
                : business.isOpen
                  ? `Open · closes ${formatTime(business.closingTime!)}`
                  : `Closed · opens ${formatTime(business.openingTime!)}`}
            </span>
          )}
          {business.totalReviews > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star className="size-4 fill-star text-star" aria-hidden />
              {business.averageRating.toFixed(1)}
              <span className="font-normal text-text-secondary">({business.totalReviews})</span>
            </span>
          )}
          {business.followersCount > 0 && (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <Users className="size-4" aria-hidden />
              {business.followersCount} {business.followersCount === 1 ? 'follower' : 'followers'}
            </span>
          )}
        </motion.div>

        {business.description && (
          <motion.div variants={staggerItem}>
            <ExpandableText text={business.description} limit={110} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
