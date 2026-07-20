import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Heart, Gift, Store } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/format'
import { toast } from '@/utils/toast'
import { useToggleFavorite } from '../hooks/useFavorites'
import type { Business } from '../types'

interface BusinessCardProps {
  business: Business
}

/** Discovery card (document/phase/05 §Business Card). */
export function BusinessCard({ business }: BusinessCardProps) {
  const { isAuthenticated } = useAuth()
  const toggle = useToggleFavorite()
  // Optimistic local state, seeded from the server flag.
  const [favorite, setFavorite] = useState(business.isFavorite)

  function onToggleFavorite() {
    if (!isAuthenticated) {
      toast.info('Sign in to save favorites')
      return
    }
    const next = !favorite
    setFavorite(next)
    toggle.mutate(
      { slug: business.slug, next },
      { onError: () => setFavorite(!next) },
    )
  }

  return (
    <Card padding="none" interactive className="overflow-hidden">
      <div className="relative">
        {business.coverImage ? (
          <img
            src={business.coverImage}
            alt={business.name}
            loading="lazy"
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="grid h-36 w-full place-items-center bg-surface-muted text-text-muted">
            <Store className="size-8" aria-hidden />
          </div>
        )}
        <IconButton
          size="sm"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute right-3 top-3 bg-surface/90 text-text-secondary backdrop-blur hover:bg-surface"
        >
          <motion.span
            className="inline-flex"
            animate={{ scale: favorite ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.25 }}
          >
            <Heart className={cn(favorite && 'fill-primary text-primary')} aria-hidden />
          </motion.span>
        </IconButton>
        <Badge tone={business.isOpen ? 'success' : 'neutral'} className="absolute bottom-3 left-3">
          {business.isOpen ? 'Open now' : 'Closed'}
        </Badge>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-muted text-text-muted">
            {business.logo ? (
              <img src={business.logo} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
              <Store className="size-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-body-lg font-semibold text-foreground">{business.name}</h3>
            {business.category && <p className="text-caption text-text-secondary">{business.category}</p>}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="size-4 fill-gold text-gold" aria-hidden />
            {business.rating.toFixed(1)}
          </span>
          {business.distanceMeters != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {formatDistance(business.distanceMeters)}
            </span>
          )}
          {business.offerCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Gift className="size-4" aria-hidden />
              {business.offerCount} offers
            </span>
          )}
        </div>

        <Link
          to={ROUTES.businessProfile(business.slug)}
          className="mt-4 flex h-11 items-center justify-center rounded-button bg-primary text-body font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
        >
          Visit & Spin
        </Link>
      </div>
    </Card>
  )
}
