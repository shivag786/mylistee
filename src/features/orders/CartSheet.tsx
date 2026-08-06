import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, Trash2, Coins, Utensils } from 'lucide-react'
import { SERVICE_META, type ServiceType } from './serviceTypes'
import { cn } from '@/utils/cn'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useBusinessLoyalty } from '@/features/wallet/hooks/useCoins'
import { cart, cartSubtotal, useCart } from './cartStore'
import { customerOrderService } from './customerOrderService'
import { ROUTES } from '@/constants/routes'

/** ₹ value of one coin — mirrors backend config('loyalty.coin_value') default. */
const COIN_VALUE = 1

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Cart + checkout (Phase 7.5). Review items, optionally spend coins, confirm. */
export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const current = useCart()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isAuthenticated, signInWithGoogle } = useAuth()
  const [useCoins, setUseCoins] = useState(false)
  const [note, setNote] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  // Service (fulfilment) context (Phase 7.6). Config is captured on the cart; a
  // pickup-only shop falls back cleanly so bakeries see no change.
  const service = current?.service
  const modes: ServiceType[] = service?.modes ?? ['pickup']
  const tables = service?.tables ?? []
  const deliveryFee = service?.deliveryFee ?? 0
  const preboundTableId = current?.tableId ?? null
  const preboundTable = preboundTableId ? tables.find((t) => t.id === preboundTableId) ?? null : null

  const [serviceType, setServiceType] = useState<ServiceType>('pickup')
  const [tableId, setTableId] = useState<string | null>(null)
  const [address, setAddress] = useState('')

  // The customer's coin balance at this shop (only when signed in).
  const { data: loyalty } = useBusinessLoyalty(current?.businessSlug ?? '', open && isAuthenticated && Boolean(current))
  const balance = loyalty?.businessBalance ?? 0

  useEffect(() => {
    if (open) {
      setUseCoins(false)
      setNote('')
      // Scanned a table QR ⇒ default to dine-in; else the shop's preferred mode.
      const initial: ServiceType = preboundTableId ? 'dine_in' : service?.defaultMode ?? 'pickup'
      setServiceType(modes.includes(initial) ? initial : modes[0])
      setTableId(preboundTableId)
      setAddress('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const showModePicker = modes.length > 1
  const needsAddress = serviceType === 'delivery'
  const addressReady = !needsAddress || address.trim().length > 0
  const fee = serviceType === 'delivery' ? deliveryFee : 0

  const subtotal = cartSubtotal(current)
  // Coins are a combo perk: the cap is the sum of each combo's "accept up to N
  // coins" (× quantity). No coin-accepting combo ⇒ coins can't be applied.
  const comboCoinCap = (current?.items ?? []).reduce(
    (sum, i) => sum + (i.type === 'combo' ? (i.coinsAccepted ?? 0) * i.quantity : 0),
    0,
  )
  const coinsAccepted = comboCoinCap > 0
  const coinsToApply = useCoins
    ? Math.min(balance, comboCoinCap, Math.floor(subtotal / COIN_VALUE))
    : 0
  const coinDiscount = coinsToApply * COIN_VALUE
  const payable = Math.max(0, subtotal - coinDiscount) + fee

  // Guard the toggle: alert instead of silently doing nothing when there's
  // nothing to apply.
  function toggleCoins(next: boolean) {
    if (next && balance <= 0) {
      toast.info('You don’t have any coins at this shop yet.')
      return
    }
    setUseCoins(next)
  }

  const place = useMutation({
    mutationFn: () =>
      customerOrderService.place({
        business: current!.businessSlug,
        items: current!.items.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
        coinsToUse: coinsToApply,
        note: note.trim() || undefined,
        serviceType,
        table: serviceType === 'dine_in' ? tableId ?? undefined : undefined,
        serviceAddress: serviceType === 'delivery' ? address.trim() || undefined : undefined,
      }),
    onSuccess: (order) => {
      // Order placed → empty the cart, close the sheet, and go to the orders page
      // (the token shows there). Invalidate so it appears immediately.
      cart.clear()
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] })
      toast.success(`Order placed! Your token is ${order.token}.`)
      onOpenChange(false)
      navigate(ROUTES.orders)
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
  })

  // If logged out, sign in with Google first (stays on the same page), then place.
  async function handlePlace() {
    if (needsAddress && !addressReady) {
      toast.info('Please add a delivery address.')
      return
    }
    if (!isAuthenticated) {
      setSigningIn(true)
      try {
        await signInWithGoogle()
      } catch {
        toast.error('Sign-in was cancelled.')
        return
      } finally {
        setSigningIn(false)
      }
    }
    place.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle>Your order</SheetTitle>
              <SheetDescription>{current?.businessName}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {!current || current.items.length === 0 ? (
                <p className="py-8 text-center text-body text-text-muted">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {current.items.map((item) => (
                      <li key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-image bg-surface-muted">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <Utensils className="size-4 text-text-muted" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-medium text-foreground">{item.name}</p>
                          <p className="text-caption text-text-secondary">₹{item.unitPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => cart.setQuantity(item.type, item.id, item.quantity - 1)}
                            className="grid size-7 place-items-center rounded-full border border-border text-foreground hover:bg-surface-muted"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <span className="w-5 text-center text-body font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => cart.setQuantity(item.type, item.id, item.quantity + 1)}
                            className="grid size-7 place-items-center rounded-full border border-border text-foreground hover:bg-surface-muted"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => cart.remove(item.type, item.id)}
                            className="ml-1 text-text-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Service mode (Phase 7.6) — hidden for pickup-only shops. */}
                  {showModePicker && (
                    <div className="space-y-2">
                      <p className="text-caption font-medium text-foreground">How would you like it?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {modes.map((mode) => {
                          const meta = SERVICE_META[mode]
                          const Icon = meta.icon
                          const active = serviceType === mode
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setServiceType(mode)}
                              className={cn(
                                'flex items-center gap-2 rounded-xl border p-3 text-left transition-colors',
                                active
                                  ? 'border-primary bg-primary-soft text-foreground'
                                  : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
                              )}
                              aria-pressed={active}
                            >
                              <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-text-muted')} aria-hidden />
                              <span className="min-w-0">
                                <span className="block text-caption font-medium text-foreground">{meta.label}</span>
                                <span className="block truncate text-small text-text-muted">{meta.hint}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dine-in table (Phase 7.6). Pre-bound from a table QR, else pickable. */}
                  {serviceType === 'dine_in' && (
                    preboundTable ? (
                      <div className="flex items-center gap-2 rounded-xl bg-info-soft p-3 text-caption text-info">
                        <Utensils className="size-4" aria-hidden />
                        <span className="font-medium">You’re at {preboundTable.label}</span>
                      </div>
                    ) : tables.length > 0 ? (
                      <label className="block space-y-1">
                        <span className="text-caption font-medium text-foreground">Table</span>
                        <select
                          value={tableId ?? ''}
                          onChange={(e) => setTableId(e.target.value || null)}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-body text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="">No specific table (tell the waiter)</option>
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null
                  )}

                  {/* Delivery address (Phase 7.6). */}
                  {serviceType === 'delivery' && (
                    <label className="block space-y-1">
                      <span className="text-caption font-medium text-foreground">Delivery address</span>
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        placeholder="Flat / house, street, landmark…"
                      />
                    </label>
                  )}

                  {isAuthenticated && coinsAccepted && (
                    <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-caption font-medium text-foreground">
                          <Coins className="size-4 text-premium-foreground" aria-hidden /> Use my Listee coins
                        </span>
                        <span className="text-small text-text-secondary">
                          {balance > 0
                            ? `You have ${balance} · this offer accepts up to ${comboCoinCap} coins.`
                            : `No coins yet — this offer accepts up to ${comboCoinCap} coins.`}
                        </span>
                      </span>
                      <Switch checked={useCoins} onCheckedChange={toggleCoins} />
                    </label>
                  )}

                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Add a note (optional)"
                  />

                  <div className="space-y-1 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-caption text-text-secondary">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    {coinsToApply > 0 && (
                      <div className="flex items-center justify-between text-caption text-premium-foreground">
                        <span>Coins used ({coinsToApply})</span>
                        <span>−₹{coinDiscount}</span>
                      </div>
                    )}
                    {fee > 0 && (
                      <div className="flex items-center justify-between text-caption text-text-secondary">
                        <span>Delivery fee</span>
                        <span>₹{fee}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-body font-semibold text-foreground">
                      <span>To pay</span>
                      <span>₹{payable}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={place.isPending}>
                Add more
              </Button>
              <Button
                className="flex-1"
                onClick={() => void handlePlace()}
                isLoading={place.isPending || signingIn}
                disabled={!current || current.items.length === 0 || !addressReady}
              >
                {isAuthenticated ? 'Place order' : 'Sign in & place order'}
              </Button>
            </SheetFooter>
        </>
      </SheetContent>
    </Sheet>
  )
}
