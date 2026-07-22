import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Heart, Store, Zap, BadgeCheck, MapPin } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/format'
import { toast } from '@/utils/toast'
import { useToggleFavorite } from '../hooks/useFavorites'
import type { Business } from '../types'

interface ShopCardProps {
  business: Business
}

/**
 * Compact discovery card (document/phase/05 §Business Card). The whole card is a
 * link to the profile (a stretched link — no CTA button); the favorite heart is
 * the only independently-tappable element. Rating shows only when it exists
 * (never "0.0"); a "Spin available" / "New" badge sits on the cover.
 */
export function ShopCard({ business }: ShopCardProps) {
  const { isAuthenticated } = useAuth()
  const toggle = useToggleFavorite()
  const [favorite, setFavorite] = useState(business.isFavorite)

  const hasRating = business.rating > 0 && business.reviewCount > 0

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
    <Card padding="none" interactive className="group relative h-full overflow-hidden">
      {/* Cover */}
      <div className="relative">
        {business.coverImage ? (
          <img
            src={business.coverImage}
            alt=""
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-28 w-full place-items-center bg-surface-muted text-text-muted">
            <Store className="size-7" aria-hidden />
          </div>
        )}

        {/* One badge slot — spin availability wins, else "new". */}
        {business.spinAvailable ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-premium px-2 py-0.5 text-small font-semibold text-white shadow-sm">
            <Zap className="size-3 fill-white" aria-hidden />
            Spin
          </span>
        ) : business.isNew ? (
          <span className="absolute left-2 top-2 rounded-full bg-info px-2 py-0.5 text-small font-semibold text-white shadow-sm">
            New
          </span>
        ) : null}

        {/* Favorite — sits above the stretched link. */}
        <IconButton
          size="sm"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute right-2 top-2 z-10 size-8 bg-surface/90 text-text-secondary backdrop-blur hover:bg-surface"
        >
          <motion.span
            className="inline-flex"
            animate={{ scale: favorite ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.25 }}
          >
            <Heart className={cn('size-4', favorite && 'fill-primary text-primary')} aria-hidden />
          </motion.span>
        </IconButton>
      </div>

      {/* Body */}
      <div className="flex gap-2.5 p-3">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-muted text-text-muted">
          {business.logo ? (
            <img src={business.logo} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <Store className="size-4" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1 text-body font-semibold leading-tight text-foreground">
            {/* Stretched link — makes the whole card tappable, no button. */}
            <Link
              to={ROUTES.businessProfile(business.slug)}
              className="line-clamp-2 after:absolute after:inset-0"
            >
              {business.name}
            </Link>
            {business.verified && (
              <BadgeCheck className="mt-0.5 size-4 shrink-0 fill-info text-white" aria-label="Verified" />
            )}
          </h3>

          {business.category && (
            <p className="truncate text-caption text-text-secondary">{business.category}</p>
          )}

          {(hasRating || business.distanceMeters != null) && (
            <div className="mt-1 flex items-center gap-2.5 text-caption text-text-secondary">
              {hasRating && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-3.5 fill-gold text-gold" aria-hidden />
                  {business.rating.toFixed(1)}
                  <span className="font-normal text-text-muted">({business.reviewCount})</span>
                </span>
              )}
              {business.distanceMeters != null && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {formatDistance(business.distanceMeters)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
