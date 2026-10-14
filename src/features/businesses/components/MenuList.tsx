import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Utensils, Star, Sparkles, Layers, Tag, Plus, Minus, Flame, Expand } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ExpandableText } from '@/components/data/ExpandableText'
import { cart, useCart, type CartItem } from '@/features/orders/cartStore'
import { fadeInUp } from '@/animations'
import { cn } from '@/utils/cn'
import type { PublicCombo, PublicMenuSection, PublicProduct } from '../publicTypes'
import { requestTiltPermission } from '../hooks/useTilt'
import { DishPhoto } from './dish/DishPhoto'
import { DishViewer } from './dish/DishViewer'
import { comboDish, dishKey, productDish, viewableDishes, type Dish } from './dish/dish'
import { ComboCard } from './dish/ComboCard'
import { ComboSheet } from './dish/ComboSheet'
import { ComboTimer } from '@/features/combos/components/ComboTimer'
import { useAppConfig } from '@/hooks/useAppConfig'

/** `quiet` skips the "added" toast — the dish viewer shows its own cart button instead. */
type AddHandler = (item: Omit<CartItem, 'quantity'>, opts?: { quiet?: boolean }) => void
type OpenHandler = (key: string) => void

/**
 * Whether menu cards are tinted with each dish's colours — the admin's "dish
 * colours on shop menu cards" switch. The full-screen viewer ignores it.
 */
const TintContext = createContext(true)

const FOOD_DOT: Record<string, string> = {
  veg: 'border-success text-success',
  non_veg: 'border-destructive text-destructive',
  egg: 'border-warning text-warning',
}

/** "Must try" needs a few photos to look like a shelf rather than a gap. */
const MUST_TRY_MIN = 2
const MUST_TRY_MAX = 10

interface MenuListProps {
  menu: PublicMenuSection[]
  combos: PublicCombo[]
  businessSlug: string
  onAdd?: AddHandler
  /** Product to scroll to and highlight (deep-link from a home deal). */
  focusProductId?: string
}

/**
 * Customer-facing menu (Phase 7.4/7.5): a "Must try" shelf, then combos and
 * products by section. Photos show whole at their 4:3 upload shape with a glow
 * in the dish's colours; tapping one opens the full-screen 3D dish viewer.
 */
export function MenuList({ menu, combos, businessSlug, onAdd, focusProductId }: MenuListProps) {
  const cartData = useCart()
  const inShop = cartData?.businessSlug === businessSlug
  const { data: config } = useAppConfig()
  const tint = config?.theme?.menuCardColors ?? true

  const qtyOf = (type: CartItem['type'], id: string) =>
    inShop ? (cartData?.items.find((i) => i.type === type && i.id === id)?.quantity ?? 0) : 0

  const activeCombos = combos.filter((c) => c.isActiveNow)
  // Combos open their own sheet (every item listed), so the photo viewer is products only.
  const dishes = useMemo(() => viewableDishes(menu), [menu])
  const [openComboId, setOpenComboId] = useState<string | null>(null)
  const openCombo = activeCombos.find((c) => c.id === openComboId) ?? null
  const mustTry = useMemo(() => {
    const picks = menu
      .flatMap((s) => s.products.map((p) => ({ p, s })))
      .filter(({ p }) => p.imageUrl && p.inStock && (p.isBestseller || p.isTodaysSpecial || p.isPopular || p.isRecommended))
      .slice(0, MUST_TRY_MAX)
      .map(({ p, s }) => productDish(p, s.name))
    return picks.length >= MUST_TRY_MIN ? picks : []
  }, [menu])

  const [viewerAt, setViewerAt] = useState<number | null>(null)
  const openDish: OpenHandler = (key) => {
    const at = dishes.findIndex((d) => d.key === key)
    if (at < 0) return
    // Asked inside the tap: iOS only shows the motion prompt from a gesture.
    void requestTiltPermission().finally(() => setViewerAt(at))
  }

  if (menu.length === 0 && activeCombos.length === 0) {
    return (
      <EmptyState
        icon={<Utensils className="size-7" />}
        title="Menu coming soon"
        description="This shop hasn't added its menu yet. Check back shortly."
      />
    )
  }

  return (
    <TintContext.Provider value={tint}>
    <div className="space-y-6">
      {mustTry.length > 0 && (
        <section className="space-y-2">
          <SectionTitle icon={<Flame className="size-4 text-warning" aria-hidden />}>Must try</SectionTitle>
          <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
            {mustTry.map((dish, i) => (
              <MustTryCard
                key={dish.key}
                dish={dish}
                index={i}
                qty={qtyOf(dish.type, dish.id)}
                onOpen={openDish}
                onAdd={onAdd}
              />
            ))}
          </div>
        </section>
      )}

      {activeCombos.length > 0 && (
        <section className="space-y-2">
          <SectionTitle icon={<Layers className="size-4 text-primary" aria-hidden />}>Combos</SectionTitle>
          {/* Several combos swipe sideways like deals; a single one takes the full width. */}
          <div
            className={cn(
              activeCombos.length > 1 &&
                '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]',
            )}
          >
            {activeCombos.map((combo, i) => (
              <RevealCard
                key={combo.id}
                delay={Math.min(i, 3) * 0.08}
                className={cn(activeCombos.length > 1 && 'w-[85%] max-w-sm shrink-0 snap-start')}
              >
                <ComboItem combo={combo} qty={qtyOf('combo', combo.id)} onAdd={onAdd} onOpen={() => setOpenComboId(combo.id)} />
              </RevealCard>
            ))}
          </div>
        </section>
      )}

      {menu.map((section) => (
        <section key={section.id} className="space-y-2">
          <SectionTitle>{section.name}</SectionTitle>
          <div className="space-y-3">
            {section.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={qtyOf('product', product.id)}
                onAdd={onAdd}
                onOpen={openDish}
                focus={product.id === focusProductId}
              />
            ))}
          </div>
        </section>
      ))}

      <ComboSheet
        combo={openCombo}
        onOpenChange={(o) => !o && setOpenComboId(null)}
        action={
          openCombo &&
          onAdd && (
            <AddControl
              qty={qtyOf('combo', openCombo.id)}
              onAdd={() => onAdd(comboDish(openCombo).cartItem)}
              onInc={() => cart.setQuantity('combo', openCombo.id, qtyOf('combo', openCombo.id) + 1)}
              onDec={() => cart.setQuantity('combo', openCombo.id, qtyOf('combo', openCombo.id) - 1)}
            />
          )
        }
      />

      <DishViewer
        dishes={dishes}
        openAt={viewerAt}
        onClose={() => setViewerAt(null)}
        qtyOf={(d: Dish) => qtyOf(d.type, d.id)}
        onAdd={onAdd ? (d: Dish) => onAdd(d.cartItem, { quiet: true }) : undefined}
      />
    </div>
    </TintContext.Provider>
  )
}

function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-body-lg font-bold text-foreground">
      {icon}
      {children}
    </h3>
  )
}

/** Fades a card up the first time it scrolls into view. */
function RevealCard({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * "Most ordered" social-proof badge. Shows the real order count whenever the item
 * has been ordered; a hot flame + warning tone once it clears the popularity
 * threshold, otherwise a quiet neutral count.
 */
function PopularBadge({ count, popular }: { count?: number | null; popular?: boolean }) {
  const n = count ?? 0
  return (
    <Badge tone={popular ? 'warning' : 'neutral'} size="sm" className="gap-0.5">
      <Flame className={cn('size-2.5', popular && 'fill-current')} aria-hidden />
      {n > 0 ? `${n} ordered` : 'Popular'}
    </Badge>
  )
}

/**
 * Add button, morphing into a −/qty/+ stepper once the item is in the cart.
 * `floating` sits it over the bottom edge of a photo.
 */
function AddControl({
  qty,
  disabled,
  floating,
  onAdd,
  onInc,
  onDec,
}: {
  qty: number
  disabled?: boolean
  floating?: boolean
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}) {
  const reduce = useReducedMotion()
  const shell = cn(
    'inline-flex h-9 min-w-[5.5rem] items-center justify-center rounded-full text-caption font-bold',
    floating ? 'bg-surface text-primary shadow-floating ring-1 ring-border' : 'border border-primary text-primary',
  )

  if (disabled) {
    return (
      <span className={cn(shell, 'min-w-0 px-3 font-medium text-destructive', !floating && 'border-transparent')}>
        Out of stock
      </span>
    )
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {qty <= 0 ? (
        <motion.button
          key="add"
          type="button"
          onClick={onAdd}
          whileTap={{ scale: 0.92 }}
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(shell, 'gap-1 px-4 hover:bg-primary-soft')}
        >
          <Plus className="size-3.5" aria-hidden /> ADD
        </motion.button>
      ) : (
        <motion.div
          key="stepper"
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(shell, 'justify-between gap-1 px-1')}
        >
          <button type="button" aria-label="Decrease" onClick={onDec} className="grid size-7 place-items-center rounded-full hover:bg-primary-soft">
            <Minus className="size-3.5" aria-hidden />
          </button>
          <motion.span
            key={qty}
            initial={reduce ? false : { y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-4 text-center text-foreground"
          >
            {qty}
          </motion.span>
          <button type="button" aria-label="Increase" onClick={onInc} className="grid size-7 place-items-center rounded-full hover:bg-primary-soft">
            <Plus className="size-3.5" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A faint wash of the dish's colours across the card, behind everything. */
function AmbientWash({ src }: { src: string }) {
  if (!useContext(TintContext)) return null
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className="pointer-events-none absolute -right-1/4 top-0 h-full w-3/4 scale-150 object-cover opacity-[0.13] blur-2xl saturate-150"
    />
  )
}

/** Photo button that opens the 3D viewer. */
function PhotoButton({ src, label, onOpen }: { src: string; label: string; onOpen: () => void }) {
  const tint = useContext(TintContext)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.95 }}
      className="group relative block w-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`View ${label}`}
    >
      <DishPhoto
        src={src}
        glow={tint ? 'soft' : 'none'}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
      <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm" aria-hidden>
        <Expand className="size-3" />
      </span>
    </motion.button>
  )
}

function MustTryCard({
  dish,
  index,
  qty,
  onOpen,
  onAdd,
}: {
  dish: Dish
  index: number
  qty: number
  onOpen: OpenHandler
  onAdd?: AddHandler
}) {
  return (
    <RevealCard delay={Math.min(index, 4) * 0.06} className="w-40 shrink-0 snap-start">
      <div className="space-y-2">
        <PhotoButton src={dish.imageUrl!} label={dish.name} onOpen={() => onOpen(dish.key)} />
        <div className="space-y-0.5 px-0.5">
          <p className="line-clamp-1 text-caption font-semibold text-foreground">{dish.name}</p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-caption font-bold text-foreground">₹{dish.price}</span>
            {onAdd && (
              <AddControl
                qty={qty}
                onAdd={() => onAdd(dish.cartItem)}
                onInc={() => cart.setQuantity(dish.type, dish.id, qty + 1)}
                onDec={() => cart.setQuantity(dish.type, dish.id, qty - 1)}
              />
            )}
          </div>
        </div>
      </div>
    </RevealCard>
  )
}

function ProductCard({
  product,
  qty,
  onAdd,
  onOpen,
  focus,
}: {
  product: PublicProduct
  qty: number
  onAdd?: AddHandler
  onOpen: OpenHandler
  focus?: boolean
}) {
  const dish = productDish(product, '')
  const hasOffer = Boolean(product.activeOffer) && product.effectivePrice != null

  const ref = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState(false)

  // Deep-linked from a home deal: scroll into view and pulse a ring briefly.
  useEffect(() => {
    if (!focus) return
    const el = ref.current
    const t = setTimeout(() => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlight(true)
    }, 250)
    const clear = setTimeout(() => setHighlight(false), 2600)
    return () => {
      clearTimeout(t)
      clearTimeout(clear)
    }
  }, [focus])

  const add = onAdd ? () => onAdd(dish.cartItem) : undefined
  const control = add && (
    <AddControl
      qty={qty}
      disabled={!product.inStock}
      floating={Boolean(product.imageUrl)}
      onAdd={add}
      onInc={() => cart.setQuantity('product', product.id, qty + 1)}
      onDec={() => cart.setQuantity('product', product.id, qty - 1)}
    />
  )

  return (
    <RevealCard>
      <Card
        ref={ref}
        id={`product-${product.id}`}
        className={cn(
          'relative flex scroll-mt-24 gap-3 overflow-hidden transition-shadow duration-300',
          highlight && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          !product.inStock && 'opacity-70',
        )}
        padding="sm"
      >
        {product.imageUrl && <AmbientWash src={product.imageUrl} />}

        <div className="relative min-w-0 flex-1 py-0.5">
          {/* items-start + the dot's nudge keep the veg/non-veg marker on the
              first line now that long names wrap instead of truncating. */}
          <div className="flex items-start gap-1.5">
            {product.foodType && (
              <span className={`mt-1 grid size-3 shrink-0 place-items-center rounded-[3px] border-2 ${FOOD_DOT[product.foodType] ?? ''}`} aria-label={product.foodType}>
                <span className="size-1 rounded-full bg-current" />
              </span>
            )}
            <p className="text-body font-semibold break-words text-foreground">{product.name}</p>
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-body font-bold ${hasOffer ? 'text-success' : 'text-foreground'}`}>₹{dish.price}</span>
            {dish.strikePrice != null && <span className="text-small text-text-muted line-through">₹{dish.strikePrice}</span>}
            {product.discountPercent > 0 && !hasOffer && (
              <Badge size="sm" className="bg-offer-soft text-offer">{product.discountPercent}% off</Badge>
            )}
          </div>

          {(((product.orderCount ?? 0) > 0 || product.isPopular) ||
            product.isBestseller ||
            product.isTodaysSpecial ||
            product.promo) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {((product.orderCount ?? 0) > 0 || product.isPopular) && (
                <PopularBadge count={product.orderCount} popular={product.isPopular} />
              )}
              {product.isBestseller && (
                <Badge tone="premium" size="sm" className="gap-0.5">
                  <Star className="size-2.5" aria-hidden /> Bestseller
                </Badge>
              )}
              {product.isTodaysSpecial && (
                <Badge tone="warning" size="sm" className="gap-0.5">
                  <Sparkles className="size-2.5" aria-hidden /> Special
                </Badge>
              )}
              {product.promo && (
                <Badge tone="primary" size="sm" className="gap-0.5">
                  <Tag className="size-2.5" aria-hidden /> {product.promo.label}
                </Badge>
              )}
              {product.promo?.endsAt && <ComboTimer endsAt={product.promo.endsAt} className="px-2 py-0.5 shadow-none" />}
            </div>
          )}

          {product.description && <ExpandableText text={product.description} limit={90} className="mt-1.5 text-small" />}
        </div>

        {product.imageUrl ? (
          <div className="relative flex w-32 shrink-0 flex-col items-center pb-1">
            <PhotoButton src={product.imageUrl} label={product.name} onOpen={() => onOpen(dishKey('product', product.id))} />
            {control && <div className="relative z-10 -mt-4">{control}</div>}
          </div>
        ) : (
          control && <div className="relative shrink-0 self-center">{control}</div>
        )}
      </Card>
    </RevealCard>
  )
}

/** Wires a combo's cart state into the showcase card. */
function ComboItem({
  combo,
  qty,
  onAdd,
  onOpen,
}: {
  combo: PublicCombo
  qty: number
  onAdd?: AddHandler
  onOpen: () => void
}) {
  const tint = useContext(TintContext)
  const dish = comboDish(combo)
  const control = onAdd && (
    <AddControl
      qty={qty}
      onAdd={() => onAdd(dish.cartItem)}
      onInc={() => cart.setQuantity('combo', combo.id, qty + 1)}
      onDec={() => cart.setQuantity('combo', combo.id, qty - 1)}
    />
  )

  return <ComboCard combo={combo} control={control} tint={tint} onOpen={onOpen} className="h-full" />
}
