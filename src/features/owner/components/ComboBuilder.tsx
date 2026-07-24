import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus, Minus, X, Check, Utensils, ShoppingBasket } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageCropField } from '@/components/forms/ImageCropField'
import { Spinner } from '@/components/feedback/Spinner'
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal'
import { useProducts, useProductCategories } from '../hooks/useProducts'
import { useComboActions } from '../hooks/useCombos'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'
import type { Combo, ComboFormValues } from '../comboTypes'
import type { Product } from '../productTypes'

interface Picked {
  productId: string
  name: string
  imageUrl: string | null
  sellingPrice: number
  quantity: number
}

interface ComboBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo: Combo | null
}

const MAX = 3
const MIN = 2

/**
 * Combo Builder (Phase 7.3) — pick a section, tap 2–3 products (they pop into
 * the basket), then name and price the combo. Totals + savings update live.
 */
export function ComboBuilder({ open, onOpenChange, combo }: ComboBuilderProps) {
  const reduce = useReducedMotion()
  const { data: products } = useProducts()
  const { data: sections } = useProductCategories()
  const { create, update } = useComboActions()
  const isEdit = combo !== null

  const [sectionId, setSectionId] = useState<string>('all')
  const didDefaultSection = useRef(false)
  const [picked, setPicked] = useState<Picked[]>([])
  const [name, setName] = useState('')
  const [comboPrice, setComboPrice] = useState('')
  const [coins, setCoins] = useState('')
  const [walletCoins, setWalletCoins] = useState(false)
  const [coinsAccepted, setCoinsAccepted] = useState('')
  const [coupon, setCoupon] = useState('')
  const [bonus, setBonus] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(combo?.name ?? '')
    setComboPrice(combo ? String(combo.comboPrice) : '')
    setCoins(combo?.coinsEarned != null ? String(combo.coinsEarned) : '')
    setWalletCoins(combo?.walletCoinsAccepted ?? false)
    setCoinsAccepted(combo?.coinsAccepted ? String(combo.coinsAccepted) : '')
    setCoupon(combo?.nextVisitCoupon ?? '')
    setBonus(combo?.bonusReward ?? '')
    setImage(null)
    setVisible(combo?.isVisible ?? true)
    setError(null)
    setPicked(
      combo
        ? combo.items.map((i) => ({
            productId: i.productId,
            name: i.name ?? 'Product',
            imageUrl: i.imageUrl,
            sellingPrice: i.sellingPrice ?? 0,
            quantity: i.quantity,
          }))
        : [],
    )
  }, [open, combo])

  // Default the active tab to the FIRST category (07C — start where the products
  // are), once per open and only after sections load. Never overrides a later
  // manual choice.
  useEffect(() => {
    if (!open) {
      didDefaultSection.current = false
      return
    }
    if (didDefaultSection.current || sections === undefined) return
    didDefaultSection.current = true
    setSectionId(sections.length > 0 ? sections[0].id : 'all')
  }, [open, sections])

  const visibleProducts = useMemo(() => {
    const list = products ?? []
    return sectionId === 'all' ? list : list.filter((p) => p.categoryId === sectionId)
  }, [products, sectionId])

  const { visible: shownProducts, hasMore, sentinelRef } = useProgressiveReveal(visibleProducts, 12)

  const totalPrice = picked.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0)
  const priceNum = Number(comboPrice) || 0
  const savings = Math.max(0, totalPrice - priceNum)
  const pending = create.isPending || update.isPending

  function setQuantity(productId: string, delta: number) {
    setPicked((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: Math.max(1, Math.min(9, p.quantity + delta)) }
          : p,
      ),
    )
  }

  function toggleProduct(product: Product) {
    setPicked((prev) => {
      const existing = prev.find((p) => p.productId === product.id)
      if (existing) return prev.filter((p) => p.productId !== product.id)
      if (prev.length >= MAX) {
        toast.info(`A combo can have up to ${MAX} products`)
        return prev
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          sellingPrice: product.sellingPrice,
          quantity: 1,
        },
      ]
    })
  }

  async function handleSave() {
    if (!name.trim()) return setError('Give the combo a name.')
    if (picked.length < MIN) return setError(`Pick at least ${MIN} products.`)
    if (!comboPrice || priceNum <= 0) return setError('Set a combo price.')

    const values: ComboFormValues = {
      name: name.trim(),
      combo_price: priceNum,
      coins_earned: coins ? Number(coins) : null,
      wallet_coins_accepted: walletCoins,
      coins_accepted: walletCoins && coinsAccepted ? Number(coinsAccepted) : 0,
      next_visit_coupon: coupon.trim() || null,
      bonus_reward: bonus.trim() || null,
      is_visible: visible,
      items: picked.map((p) => ({ product_id: p.productId, quantity: p.quantity })),
      image,
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: combo.id, values })
        toast.success('Combo updated')
      } else {
        await create.mutateAsync(values)
        toast.success('Combo created')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  const pickedIds = new Set(picked.map((p) => p.productId))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-lg flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit combo' : 'Build a combo'}</SheetTitle>
          <SheetDescription>Tap {MIN}–{MAX} products, then name and price your combo.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Basket */}
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted p-3">
            <div className="mb-2 flex items-center gap-2 text-caption font-medium text-text-secondary">
              <ShoppingBasket className="size-4" aria-hidden />
              Combo basket ({picked.length}/{MAX})
            </div>
            {picked.length === 0 ? (
              <p className="py-3 text-center text-small text-text-muted">Tap products below to add them.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {picked.map((p) => (
                    <motion.div
                      key={p.productId}
                      layout={!reduce}
                      initial={reduce ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-2 shadow-soft"
                    >
                      <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-surface-muted">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <Utensils className="size-3.5 text-text-muted" aria-hidden />
                        )}
                      </span>
                      <span className="max-w-24 truncate text-small font-medium text-foreground">{p.name}</span>
                      {/* Quantity — optional, defaults to 1. */}
                      <span className="flex items-center gap-1 rounded-full bg-surface-muted px-1 py-0.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${p.name} quantity`}
                          onClick={() => setQuantity(p.productId, -1)}
                          disabled={p.quantity <= 1}
                          className="grid size-4 place-items-center rounded-full text-text-secondary hover:text-foreground disabled:opacity-40"
                        >
                          <Minus className="size-3" aria-hidden />
                        </button>
                        <span className="min-w-4 text-center text-small font-semibold tabular-nums text-foreground">
                          {p.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${p.name} quantity`}
                          onClick={() => setQuantity(p.productId, 1)}
                          disabled={p.quantity >= 9}
                          className="grid size-4 place-items-center rounded-full text-text-secondary hover:text-foreground disabled:opacity-40"
                        >
                          <Plus className="size-3" aria-hidden />
                        </button>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setPicked((prev) => prev.filter((x) => x.productId !== p.productId))}
                        className="text-text-muted hover:text-destructive"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {picked.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-caption">
                <span className="text-text-secondary">Items total ₹{totalPrice}</span>
                {priceNum > 0 && <span className="font-semibold text-success">You save ₹{savings}</span>}
              </div>
            )}
          </div>

          {/* Section filter — categories first, All last (07C). Scrolls sideways
              so a long menu stays one tidy row instead of a tall wrapped block. */}
          {sections && sections.length > 0 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sections.map((s) => (
                <SectionChip
                  key={s.id}
                  label={s.name}
                  active={sectionId === s.id}
                  onClick={() => setSectionId(s.id)}
                />
              ))}
              <SectionChip label="All" active={sectionId === 'all'} onClick={() => setSectionId('all')} />
            </div>
          )}

          {/* Product grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {shownProducts.map((product) => {
              const active = pickedIds.has(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product)}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border bg-surface text-left transition-colors',
                    active ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-border-strong',
                  )}
                >
                  <div className="aspect-square w-full bg-surface-muted">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-text-muted">
                        <Utensils className="size-6" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-small font-medium text-foreground">{product.name}</p>
                    <p className="text-small text-text-muted">₹{product.sellingPrice}</p>
                  </div>
                  <span
                    className={cn(
                      'absolute right-2 top-2 grid size-6 place-items-center rounded-full shadow-soft transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'bg-surface/90 text-text-secondary',
                    )}
                  >
                    {active ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
                  </span>
                </button>
              )
            })}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-3">
              <Spinner size={20} label="Loading more products" />
            </div>
          )}
          {visibleProducts.length === 0 && (
            <p className="py-4 text-center text-small text-text-muted">
              No products here yet. Add products first.
            </p>
          )}

          {/* Combo details */}
          <div className="space-y-4 border-t border-border pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="combo-name">Combo name</Label>
              <Input id="combo-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Burger + Fries + Coke" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="combo-price">Combo price (₹)</Label>
                <Input id="combo-price" inputMode="decimal" value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} placeholder="199" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combo-coins">Coins earned (optional)</Label>
                <Input id="combo-coins" inputMode="numeric" value={coins} onChange={(e) => setCoins(e.target.value)} placeholder="20" />
              </div>
            </div>

            <ImageCropField
              label="Combo image (optional)"
              shape="rect"
              aspect={4 / 3}
              value={image}
              previewUrl={combo?.imageUrl}
              onChange={setImage}
              hint="Leave empty to show the item photos."
            />

            <div className="space-y-1.5">
              <Label htmlFor="combo-coupon">Next-visit coupon (optional)</Label>
              <Input id="combo-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="e.g. 10% off next visit" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="combo-bonus">Bonus reward (optional)</Label>
              <Input id="combo-bonus" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="e.g. Free dessert" />
            </div>

            <label className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-caption font-medium text-foreground">Accept wallet coins</span>
              <Switch checked={walletCoins} onCheckedChange={setWalletCoins} />
            </label>
            {walletCoins && (
              <div className="space-y-1.5">
                <Label htmlFor="combo-coins-accepted">Accept up to (coins)</Label>
                <Input
                  id="combo-coins-accepted"
                  inputMode="numeric"
                  value={coinsAccepted}
                  onChange={(e) => setCoinsAccepted(e.target.value)}
                  placeholder="e.g. 15"
                />
                <p className="text-small text-text-muted">
                  Most Listee coins a customer can spend on this combo (₹1 per coin).
                </p>
              </div>
            )}
            <label className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-caption font-medium text-foreground">Visible to customers</span>
              <Switch checked={visible} onCheckedChange={setVisible} />
            </label>

            {error && <p className="text-caption text-destructive">{error}</p>}
          </div>
        </div>

        <SheetFooter className="border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={pending} disabled={picked.length < MIN}>
            {isEdit ? 'Save combo' : 'Create combo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SectionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-small font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-secondary hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
