import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import { ChevronLeft, ChevronRight, Minus, Plus, X, Smartphone, ShoppingCart } from 'lucide-react'
import { cart, cartCount, cartSubtotal, openCartSheet, useCart } from '@/features/orders/cartStore'
import { cn } from '@/utils/cn'
import { useTilt } from '../../hooks/useTilt'
import type { Dish } from './dish'

const FOOD_DOT: Record<string, string> = {
  veg: 'border-green-400 text-green-400',
  non_veg: 'border-red-400 text-red-400',
  egg: 'border-amber-400 text-amber-400',
}

/** Shown once per browser: how to get the 3D effect. */
const TILT_HINT_KEY = 'dish-viewer-tilt-hint'

interface DishViewerProps {
  dishes: Dish[]
  /** Index of the dish to open on; null = closed. */
  openAt: number | null
  onClose: () => void
  qtyOf: (dish: Dish) => number
  onAdd?: (dish: Dish) => void
  /** +1 / −1 from the viewer's stepper; defaults to a plain quantity change. */
  onStep?: (dish: Dish, delta: 1 | -1) => void
}

/**
 * Full-screen dish viewer for customers sitting in the shop: one dish at a
 * time, large, floating over a backdrop washed in its own colours. Tilting the
 * phone (or moving the pointer) turns the dish in 3D with a moving shadow and
 * sheen; swiping sideways moves through the menu like stories.
 */
export function DishViewer({ dishes, openAt, onClose, qtyOf, onAdd, onStep }: DishViewerProps) {
  const stepBy = (d: Dish, delta: 1 | -1) =>
    onStep ? onStep(d, delta) : cart.setQuantity(d.type, d.id, qtyOf(d) + delta)
  const open = openAt !== null && dishes.length > 0
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const tilt = useTilt(open)

  const safeIndex = Math.min(Math.max(index, 0), Math.max(dishes.length - 1, 0))
  const dish = dishes[safeIndex]
  const many = dishes.length > 1

  useEffect(() => {
    if (openAt !== null) setIndex(openAt)
  }, [openAt])

  useEffect(() => {
    if (!open || reduce) return
    try {
      if (localStorage.getItem(TILT_HINT_KEY)) return
      localStorage.setItem(TILT_HINT_KEY, '1')
    } catch {
      return
    }
    setShowHint(true)
    const t = setTimeout(() => setShowHint(false), 3200)
    return () => clearTimeout(t)
  }, [open, reduce])

  function go(next: number) {
    if (!many) return
    setDir(next > safeIndex ? 1 : -1)
    setIndex((next + dishes.length) % dishes.length)
  }

  useEffect(() => {
    if (!open || !many) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(safeIndex + 1)
      if (e.key === 'ArrowLeft') go(safeIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, many, safeIndex])

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -70 || info.velocity.x < -450) go(safeIndex + 1)
    else if (info.offset.x > 70 || info.velocity.x > 450) go(safeIndex - 1)
  }

  // The shadow slides opposite the tilt and the sheen follows the light, which
  // is what sells the depth.
  const shadowX = useTransform(tilt.rotateY, (v) => -v * 1.6)
  const shadowY = useTransform(tilt.rotateX, (v) => 28 + v * 1.2)
  const sheen = useTransform(
    [tilt.rotateX, tilt.rotateY] as const,
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${50 + y * 3}% ${35 - x * 3}%, rgba(255,255,255,0.32), rgba(255,255,255,0) 55%)`,
  )

  const qty = dish ? qtyOf(dish) : 0
  const currentCart = useCart()
  const inCart = cartCount(currentCart)
  // The "added" toast would land on top of the viewer, so it shows a cart button instead.
  const showCartButton = Boolean(onAdd) && inCart > 0

  function viewCart() {
    onClose()
    openCartSheet()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 overflow-hidden bg-neutral-950 text-white outline-none select-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          // Focus the viewer itself, not its first button (which would show a focus ring on open).
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">{dish?.name ?? 'Dish'}</DialogPrimitive.Title>

          {/* Backdrop in the dish's own colours. */}
          <AnimatePresence initial={false}>
            {dish?.imageUrl && (
              <motion.img
                key={dish.key}
                src={dish.imageUrl}
                alt=""
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-90 blur-3xl saturate-150"
              />
            )}
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/85" />

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <span className="rounded-full bg-black/30 px-3 py-1 text-small font-medium backdrop-blur">
              {dish?.section}
              {many && <span className="text-white/60"> · {safeIndex + 1}/{dishes.length}</span>}
            </span>
          </div>

          {/* The dish */}
          <motion.div
            className={cn(
              'absolute inset-x-0 top-14 flex items-center justify-center px-6 [perspective:1100px]',
              showCartButton ? 'bottom-[17rem]' : 'bottom-[13.5rem]',
            )}
            drag={many ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            {...tilt.bind}
          >
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              {dish?.imageUrl && (
                <motion.div
                  key={dish.key}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 120, scale: 0.9 }),
                    center: { opacity: 1, x: 0, scale: 1 },
                    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -120, scale: 0.9 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="relative w-full max-w-[26rem]"
                >
                  {/* Float */}
                  <motion.div
                    animate={reduce ? undefined : { y: [0, -10, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Shadow on the "table" */}
                    <motion.div
                      aria-hidden
                      style={{ x: shadowX, y: shadowY }}
                      className="pointer-events-none absolute inset-x-[12%] bottom-0 h-1/3 rounded-[50%] bg-black/55 blur-2xl"
                    />
                    <motion.div
                      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
                      className="relative overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 ring-white/15"
                    >
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        draggable={false}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      {!reduce && (
                        <motion.div aria-hidden style={{ background: sheen }} className="pointer-events-none absolute inset-0" />
                      )}
                    </motion.div>
                    {/* Close sits on the photo's corner, clear of toasts at the top of the screen. */}
                    <DialogPrimitive.Close
                      className="absolute -right-2 -top-3 z-20 grid size-10 place-items-center rounded-full bg-black/60 shadow-lg ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-black/80"
                      aria-label="Close"
                      onPointerDownCapture={(e) => e.stopPropagation()}
                    >
                      <X className="size-5" aria-hidden />
                    </DialogPrimitive.Close>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute bottom-2 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-small backdrop-blur"
                >
                  <Smartphone className="size-4 animate-pulse" aria-hidden />
                  Tilt your phone · swipe for more
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Desktop arrows */}
          {many && (
            <>
              <button
                type="button"
                onClick={() => go(safeIndex - 1)}
                className="absolute left-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur hover:bg-black/50 sm:grid"
                aria-label="Previous dish"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(safeIndex + 1)}
                className="absolute right-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur hover:bg-black/50 sm:grid"
                aria-label="Next dish"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}

          {/* Details */}
          {dish && (
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={dish.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto max-w-[26rem] space-y-3 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      {dish.foodType && (
                        <span
                          className={cn('mt-1.5 grid size-3.5 shrink-0 place-items-center rounded-[3px] border-2', FOOD_DOT[dish.foodType])}
                          aria-label={dish.foodType.replace('_', '-')}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                        </span>
                      )}
                      <h2 className="text-body-lg font-bold leading-snug">{dish.name}</h2>
                    </div>
                    {dish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dish.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/15 px-2 py-0.5 text-small font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {dish.description && (
                      <p className="line-clamp-2 text-caption text-white/75">{dish.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-title font-bold">₹{dish.price}</span>
                      {dish.strikePrice != null && (
                        <span className="text-caption text-white/55 line-through">₹{dish.strikePrice}</span>
                      )}
                    </div>
                    {onAdd &&
                      (!dish.inStock ? (
                        <span className="text-caption font-medium text-red-300">Out of stock</span>
                      ) : qty > 0 ? (
                        <div className="flex items-center gap-3 rounded-full bg-white px-1.5 py-1 text-neutral-900">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => stepBy(dish, -1)}
                            className="grid size-8 place-items-center rounded-full hover:bg-neutral-100"
                          >
                            <Minus className="size-4" aria-hidden />
                          </button>
                          <motion.span
                            key={qty}
                            initial={reduce ? false : { scale: 1.4 }}
                            animate={{ scale: 1 }}
                            className="w-5 text-center text-body font-bold"
                          >
                            {qty}
                          </motion.span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => stepBy(dish, 1)}
                            className="grid size-8 place-items-center rounded-full hover:bg-neutral-100"
                          >
                            <Plus className="size-4" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onAdd(dish)}
                          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-6 text-body font-bold text-neutral-900 shadow-lg"
                        >
                          <Plus className="size-4" aria-hidden /> Add
                        </motion.button>
                      ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {showCartButton && (
                  <motion.button
                    type="button"
                    onClick={viewCart}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    whileTap={{ scale: 0.97 }}
                    className="mx-auto mt-3 flex w-full max-w-[26rem] items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-floating"
                  >
                    <span className="inline-flex items-center gap-2 text-body font-semibold">
                      <ShoppingCart className="size-5 shrink-0" aria-hidden />
                      {inCart} {inCart === 1 ? 'item' : 'items'} · ₹{cartSubtotal(currentCart)}
                    </span>
                    <span className="text-body font-bold">View cart</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {many && dishes.length <= 12 && (
                <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
                  {dishes.map((d, i) => (
                    <span
                      key={d.key}
                      className={cn('h-1.5 rounded-full transition-all', i === safeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
