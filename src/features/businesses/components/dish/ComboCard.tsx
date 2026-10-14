import { Fragment, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Coins, Expand, Flame, Layers, Plus, Utensils } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ComboTimer } from '@/features/combos/components/ComboTimer'
import { cn } from '@/utils/cn'
import type { PublicCombo, PublicComboItem } from '../../publicTypes'

/** What the card needs — a shop's own combo or one from the home feed. */
export type ComboCardData = Pick<PublicCombo, 'name' | 'imageUrl' | 'comboPrice' | 'totalPrice' | 'savings' | 'items'> &
  Partial<Pick<PublicCombo, 'orderCount' | 'isPopular' | 'coinsEarned' | 'endsAt'>>

interface ComboCardProps {
  combo: ComboCardData
  /** Under the name — e.g. the shop and its distance on the home feed. */
  subtitle?: ReactNode
  /** The ADD / stepper control. */
  control?: ReactNode
  onOpen: () => void
  /** Tint with the combo's colours (admin "dish colours" switch). */
  tint: boolean
  className?: string
}

const itemImages = (combo: ComboCardData) => combo.items.filter((i) => i.imageUrl)

/**
 * A combo as a showcase: a photo (its own, or a collage of what's in it), a
 * "what's inside" strip naming every item with its picture and quantity, then
 * the deal — combo price, what it would cost apart, and the saving.
 */
export function ComboCard({ combo, subtitle, control, onOpen, tint, className }: ComboCardProps) {
  const reduce = useReducedMotion()
  const withPhotos = itemImages(combo)
  const washSrc = combo.imageUrl ?? withPhotos[0]?.imageUrl ?? null
  const canOpen = Boolean(washSrc)
  const count = combo.items.reduce((n, i) => n + Math.max(1, i.quantity), 0)
  // 4–5 items: one even row of smaller photos, no "+" between them, so the
  // card stays the same height as a 2–3 item combo.
  const compact = combo.items.length > 3

  return (
    <Card className={cn('relative flex flex-col overflow-hidden', className)} padding="none">
      {tint && washSrc && (
        <img
          src={washSrc}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute inset-0 size-full scale-150 object-cover opacity-[0.12] blur-2xl saturate-150"
        />
      )}

      {/* Visual */}
      <motion.button
        type="button"
        onClick={canOpen ? onOpen : undefined}
        disabled={!canOpen}
        whileTap={canOpen ? { scale: 0.985 } : undefined}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-surface-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-default"
        aria-label={`View ${combo.name}`}
      >
        {combo.imageUrl ? (
          <motion.img
            src={combo.imageUrl}
            alt=""
            loading="lazy"
            initial={reduce ? false : { scale: 1.12 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0, 0, 0.2, 1] }}
            className="size-full object-cover"
          />
        ) : (
          <Collage items={combo.items} />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-small font-semibold text-white backdrop-blur">
          <Layers className="size-3.5" aria-hidden />
          Combo · {count} {count === 1 ? 'item' : 'items'}
        </span>
        {canOpen && (
          <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur" aria-hidden>
            <Expand className="size-3.5" />
          </span>
        )}
        <ComboTimer endsAt={combo.endsAt} className="absolute bottom-3 left-3" />
        {combo.savings > 0 && (
          <motion.span
            initial={reduce ? false : { scale: 0, rotate: -12 }}
            whileInView={{ scale: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.25 }}
            className="absolute bottom-3 right-3 overflow-hidden rounded-xl bg-offer px-3 py-1.5 text-caption font-black text-offer-foreground shadow-floating"
          >
            Save ₹{combo.savings}
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[sheen_3.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent motion-reduce:hidden" />
          </motion.span>
        )}
      </motion.button>

      <div className="relative flex flex-1 flex-col gap-3 p-3">
        {/* What's inside */}
        <div>
          <p className="mb-1.5 text-small font-semibold uppercase tracking-wide text-text-muted">What's inside</p>
          <motion.ul
            className={cn(
              compact ? 'grid items-start gap-1' : 'flex flex-wrap items-start gap-x-1 gap-y-2',
              compact && (combo.items.length === 4 ? 'grid-cols-4' : 'grid-cols-5'),
            )}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={reduce ? undefined : { visible: { transition: { staggerChildren: 0.09 } } }}
          >
            {combo.items.map((item, i) => (
              <Fragment key={`${item.productId ?? 'x'}-${i}`}>
                {i > 0 && !compact && (
                  <motion.li
                    aria-hidden
                    variants={{ hidden: { opacity: 0, rotate: -90 }, visible: { opacity: 1, rotate: 0 } }}
                    className="mt-3.5 grid size-5 place-items-center rounded-full bg-primary-soft text-primary"
                  >
                    <Plus className="size-3" strokeWidth={3} />
                  </motion.li>
                )}
                <motion.li
                  variants={{ hidden: { opacity: 0, y: 10, scale: 0.8 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  className={cn('flex flex-col items-center gap-1 text-center', !compact && 'w-[4.25rem]')}
                >
                  <span className="relative">
                    <span
                      className={cn(
                        'grid place-items-center overflow-hidden rounded-full bg-surface-muted ring-2 ring-surface shadow-soft',
                        compact ? 'size-10' : 'size-12',
                      )}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <Utensils className="size-4 text-text-muted" aria-hidden />
                      )}
                    </span>
                    {item.quantity > 1 && (
                      <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-bold leading-5 text-primary-foreground">
                        {item.quantity}×
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-small font-medium leading-tight text-foreground">
                    {item.name ?? 'Item'}
                  </span>
                </motion.li>
              </Fragment>
            ))}
          </motion.ul>
        </div>

        {/* The deal */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-body font-bold leading-snug text-foreground">{combo.name}</p>
            {subtitle}
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-body-lg font-black text-foreground">₹{combo.comboPrice}</span>
              {combo.totalPrice > combo.comboPrice && (
                <span className="text-caption text-text-muted line-through">₹{combo.totalPrice}</span>
              )}
            </div>
            {(((combo.orderCount ?? 0) > 0 || combo.isPopular) || combo.coinsEarned) && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-small font-medium">
                {((combo.orderCount ?? 0) > 0 || combo.isPopular) && (
                  <span className={cn('inline-flex items-center gap-0.5', combo.isPopular ? 'text-warning' : 'text-text-secondary')}>
                    <Flame className={cn('size-3', combo.isPopular && 'fill-current')} aria-hidden />
                    {(combo.orderCount ?? 0) > 0 ? `${combo.orderCount} ordered` : 'Popular'}
                  </span>
                )}
                {combo.coinsEarned ? (
                  <span className="inline-flex items-center gap-0.5 text-premium-foreground">
                    <Coins className="size-3 text-gold" aria-hidden /> +{combo.coinsEarned} coins
                  </span>
                ) : null}
              </div>
            )}
          </div>
          {control && <div className="shrink-0">{control}</div>}
        </div>
      </div>
    </Card>
  )
}

/** A combo without its own photo: its items' photos tiled, joined by "+". */
export function Collage({ items }: { items: PublicComboItem[] }) {
  const reduce = useReducedMotion()
  const tiles = items.slice(0, 5)

  if (tiles.length === 0) {
    return (
      <span className="grid size-full place-items-center bg-gradient-to-br from-primary-soft to-gold-soft">
        <Layers className="size-10 text-primary" aria-hidden />
      </span>
    )
  }

  const layout =
    tiles.length === 1
      ? 'grid-cols-1'
      : tiles.length === 2
        ? 'grid-cols-2'
        : tiles.length === 3
          ? 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2'
          : tiles.length === 4
            ? 'grid-cols-2 grid-rows-2'
            : // 5: one big photo with four small ones beside it.
              'grid-cols-3 grid-rows-2 [&>*:first-child]:row-span-2'

  return (
    <span className={cn('relative grid size-full gap-0.5', layout)}>
      {tiles.map((item, i) => (
        <motion.span
          key={`${item.productId ?? 'x'}-${i}`}
          initial={reduce ? false : { opacity: 0, scale: 1.15 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="relative overflow-hidden bg-surface-muted"
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center">
              <Utensils className="size-6 text-text-muted" aria-hidden />
            </span>
          )}
        </motion.span>
      ))}
      {tiles.length === 2 && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-primary shadow-floating" aria-hidden>
          <Plus className="size-4" strokeWidth={3} />
        </span>
      )}
    </span>
  )
}
