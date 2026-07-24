import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Minus, Plus, Trash2, Coins, PartyPopper, Utensils, Receipt } from 'lucide-react'
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
import type { Order } from '@/features/owner/orderTypes'

/** ₹ value of one coin — mirrors backend config('loyalty.coin_value') default. */
const COIN_VALUE = 1

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Cart + checkout (Phase 7.5). Review items, optionally spend coins, confirm. */
export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const current = useCart()
  const { isAuthenticated, signInWithGoogle } = useAuth()
  const [useCoins, setUseCoins] = useState(false)
  const [note, setNote] = useState('')
  const [placed, setPlaced] = useState<Order | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  // The customer's coin balance at this shop (only when signed in).
  const { data: loyalty } = useBusinessLoyalty(current?.businessSlug ?? '', open && isAuthenticated && Boolean(current))
  const balance = loyalty?.businessBalance ?? 0

  useEffect(() => {
    if (open) {
      setPlaced(null)
      setUseCoins(false)
      setNote('')
    }
  }, [open])

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
  const payable = Math.max(0, subtotal - coinDiscount)

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
      }),
    onSuccess: (order) => setPlaced(order),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
  })

  // If logged out, sign in with Google first (stays on the same page), then place.
  async function handlePlace() {
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
        {placed ? (
          <OrderPlaced order={placed} onDone={() => { cart.clear(); onOpenChange(false) }} />
        ) : (
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
                disabled={!current || current.items.length === 0}
              >
                {isAuthenticated ? 'Place order' : 'Sign in & place order'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function OrderPlaced({ order, onDone }: { order: Order; onDone: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
        <PartyPopper className="size-8" aria-hidden />
      </div>
      <div>
        <h3 className="text-subtitle font-bold text-foreground">Order placed!</h3>
        <p className="text-caption text-text-secondary">Show this token at the counter.</p>
      </div>
      <div className="rounded-2xl bg-surface-muted px-8 py-4">
        <p className="text-caption text-text-muted">Token</p>
        <p className="font-mono text-4xl font-bold tracking-widest text-foreground">{order.token}</p>
      </div>
      <div className="w-full max-w-xs space-y-1 text-caption">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span>₹{order.subtotal}</span>
        </div>
        {order.coinsUsed > 0 && (
          <div className="flex justify-between text-text-muted">
            <span>Coins used ({order.coinsUsed})</span>
            <span>−₹{order.coinDiscount}</span>
          </div>
        )}
        <div className="flex justify-between text-body font-semibold text-foreground">
          <span>To pay</span>
          <span>₹{order.total}</span>
        </div>
        {order.coinsEarned > 0 && (
          <p className="pt-1 text-premium-foreground">You'll earn {order.coinsEarned} coins when paid.</p>
        )}
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button
          fullWidth
          leftIcon={<Receipt className="size-4" />}
          onClick={() => {
            onDone()
            navigate(ROUTES.orders)
          }}
        >
          View my orders
        </Button>
        <Button variant="ghost" fullWidth onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
