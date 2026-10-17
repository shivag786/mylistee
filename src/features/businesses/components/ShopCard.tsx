import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Heart, Store, Zap, BadgeCheck, Navigation, Sparkles, Tag, Gift } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/utils/cn'
import { describeProximity, formatClockTime, formatDistance, type ProximityTone } from '@/utils/format'
import { toast } from '@/utils/toast'
import { useToggleFavorite } from '../hooks/useFavorites'
import type { Business } from '../types'

interface ShopCardProps {
  business: Business
}

/**
 * Discovery card (document/phase/05 §Business Card). The whole card is a link
 * to the profile (a stretched link — no CTA button); the favorite heart is the
 * only independently-tappable element. The photo carries the badges, open
 * status and rating; the body says how near the shop is in words ("Walking
 * distance · 8 min walk") and how many offers are live. Rating shows only when
 * it exists (never "0.0").
 */
export function ShopCard({ business }: ShopCardProps) {
  const { isAuthenticated } = useAuth()
  const toggle = useToggleFavorite()
  const [favorite, setFavorite] = useState(business.isFavorite)

  const hasRating = business.rating > 0 && business.reviewCount > 0
  // Prefer a product image; fall back to the shop banner.
  const cardImage = business.previewImage ?? business.coverImage
  const subtitle = [business.category, business.area].filter(Boolean).join(' · ')

  function onToggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.info('Sign in to save favorites')
      return
    }
    const next = !favorite
    setFavorite(next)
    toggle.mutate({ slug: business.slug, next }, { onError: () => setFavorite(!next) })
  }

  return (
    <Card padding="none" interactive className="group relative flex h-full flex-col overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {cardImage ? (
          <img
            src={cardImage}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-primary-soft to-surface-muted text-primary/60">
            <Store className="size-8" aria-hidden />
          </div>
        )}

        {/* Legibility scrim for the status and rating on the photo. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          aria-hidden
        />

        <CoverBadges business={business} />

        {/* Favorite — sits above the stretched link. */}
        <IconButton
          size="sm"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute right-2 top-2 z-10 size-8 bg-surface/90 text-text-secondary shadow-soft backdrop-blur hover:bg-surface"
        >
          <motion.span
            className="inline-flex"
            animate={{ scale: favorite ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.25 }}
          >
            <Heart className={cn('size-4', favorite && 'fill-primary text-primary')} aria-hidden />
          </motion.span>
        </IconButton>

        <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1.5">
          <OpenPill business={business} />
          {hasRating && (
            <span
              className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-success px-1.5 py-0.5 text-small font-bold text-white shadow-sm"
              aria-label={`Rated ${business.rating.toFixed(1)} from ${business.reviewCount} reviews`}
            >
              {business.rating.toFixed(1)}
              <Star className="size-3 fill-white" aria-hidden />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <h3 className="flex items-start gap-1 text-caption font-bold leading-snug text-foreground sm:text-body">
          {/* Stretched link — makes the whole card tappable, no button. */}
          <Link
            to={ROUTES.businessProfile(business.slug)}
            className="line-clamp-1 after:absolute after:inset-0"
          >
            {business.name}
          </Link>
          {business.verified && (
            <BadgeCheck className="mt-0.5 size-4 shrink-0 fill-info text-white" aria-label="Verified" />
          )}
        </h3>

        {subtitle && <p className="mt-0.5 truncate text-small text-text-secondary">{subtitle}</p>}

        {business.distanceMeters != null && <ProximityLine meters={business.distanceMeters} />}

        {business.perk && (
          <p className="mt-1.5 flex min-w-0 items-center gap-1 rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary">
            <Gift className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{business.perk}</span>
          </p>
        )}

        {business.offerCount > 0 && (
          <div className="mt-auto pt-2.5">
            <p className="flex items-center gap-1 border-t border-dashed border-border pt-2 text-small font-semibold text-offer">
              <Tag className="size-3.5 shrink-0 fill-offer/15" aria-hidden />
              <span className="truncate">
                {business.offerCount} {business.offerCount === 1 ? 'offer' : 'offers'} live
              </span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

/** Up to two badges on the photo: spin, new, then live offers. */
function CoverBadges({ business }: { business: Business }) {
  const badges: { key: string; node: React.ReactNode; className: string }[] = []
  if (business.spinAvailable) {
    badges.push({
      key: 'spin',
      className: 'bg-gradient-to-r from-gold-hover to-gold text-gold-foreground',
      node: (
        <>
          <Zap className="size-3 fill-current" aria-hidden />
          Spin & win
        </>
      ),
    })
  }
  if (business.isNew) {
    badges.push({
      key: 'new',
      className: 'bg-info text-info-foreground',
      node: (
        <>
          <Sparkles className="size-3" aria-hidden />
          New
        </>
      ),
    })
  }

  if (badges.length === 0) return null
  return (
    <div className="absolute left-2 top-2 flex max-w-[calc(100%-3rem)] flex-col items-start gap-1">
      {badges.slice(0, 2).map((b) => (
        <span
          key={b.key}
          className={cn(
            'relative inline-flex items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm',
            b.className,
          )}
        >
          {b.node}
          {/* A light sweep now and then — catches the eye without blinking. */}
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-[sheen_3.5s_ease-in-out_infinite]"
            aria-hidden
          />
        </span>
      ))}
    </div>
  )
}

/** "● Open · till 10 PM" / "● Closed · opens 9 AM" on the photo; nothing when hours aren't set. */
function OpenPill({ business }: { business: Business }) {
  const { openingTime: open, closingTime: close, isOpen } = business
  if (business.closedUntil) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-white drop-shadow">
        <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
        <span className="truncate">Closed till {new Date(business.closedUntil).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
      </span>
    )
  }
  if (!open || !close) return null
  const allDay = open.slice(0, 5) === close.slice(0, 5)

  return (
    <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-white drop-shadow">
      <span
        className={cn('size-1.5 shrink-0 rounded-full', isOpen ? 'bg-success' : 'bg-danger')}
        aria-hidden
      />
      <span className="truncate">
        {allDay ? 'Open 24 hours' : isOpen ? `Open · till ${formatClockTime(close)}` : `Closed · opens ${formatClockTime(open)}`}
      </span>
    </span>
  )
}

const TONE_CLASS: Record<ProximityTone, string> = {
  here: 'text-success',
  walk: 'text-success',
  near: 'text-info',
  far: 'text-text-secondary',
}

/** "Walking distance · 650 m · 8 min walk" — the label leads, so near shops stand out. */
function ProximityLine({ meters }: { meters: number }) {
  const { label, eta, tone } = describeProximity(meters)
  const near = tone !== 'far'

  return (
    <p className={cn('mt-1.5 flex min-w-0 items-center gap-1 text-small', TONE_CLASS[tone])}>
      {tone === 'here' ? (
        <span className="relative flex size-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
      ) : (
        <Navigation className="size-3 shrink-0" aria-hidden />
      )}
      <span className="truncate">
        {near && <span className="font-bold">{label} · </span>}
        <span className={near ? 'text-text-secondary' : 'font-medium'}>
          {formatDistance(meters)} · {eta}
        </span>
      </span>
    </p>
  )
}
