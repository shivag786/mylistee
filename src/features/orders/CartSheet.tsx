import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Trash2, Coins, Utensils, Smartphone, Banknote, CheckCircle2, Info, Store, Bike, Clock } from 'lucide-react'
import { SERVICE_META, type ServiceType } from './serviceTypes'
import { DeliveryDetails } from './delivery/DeliveryDetails'
import {
  isValidPhone,
  normalisePhone,
  readSavedDelivery,
  saveDelivery,
  type DeliveryDraft,
} from './delivery/deliveryDraft'
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
import { useCoinValue } from '@/features/wallet/coinMoney'
import { cart, cartSubtotal, lineKey, optionsLabel, useCart } from './cartStore'
import { useOrderCheckout, isOrderPaymentCancelled } from './useOrderCheckout'
import { waitForPageInteractive } from '@/features/payments/razorpay'
import { defaultChoice, splitPayment, type PaymentChoice } from './paymentSplit'
import { useAppConfig } from '@/hooks/useAppConfig'
import { rememberPostLoginTarget } from '@/features/auth/postLoginTarget'
import { ROUTES } from '@/constants/routes'
import { useCartQuote } from '@/features/rewards/useRewards'
import { BillDiscountProgress, CouponPicker, NextRewardHint } from '@/features/rewards/CartRewards'
import type { PlaceOrderPayload } from './customerOrderService'
import type { Cart } from './cartStore'

/** ₹ value of one coin — mirrors backend config('loyalty.coin_value') default. */
const COIN_VALUE = 1

const PAYMENT_OPTIONS = [
  { key: 'online', icon: Smartphone },
  { key: 'cod', icon: Banknote },
] as const satisfies ReadonlyArray<{ key: PaymentChoice; icon: typeof Smartphone }>

/** The cart's lines as the order API takes them (sizes and add-ons included). */
function orderLines(cart: Cart): PlaceOrderPayload['items'] {
  return cart.items.map((i) => ({
    type: i.type,
    id: i.id,
    quantity: i.quantity,
    ...(i.options ? { variant: i.options.variantId ?? undefined, addons: i.options.addonIds } : {}),
  }))
}

/** "Cash on delivery" only reads right for delivery; otherwise it is paid at the counter. */
function codLabel(serviceType: ServiceType): string {
  return serviceType === 'delivery' ? 'Cash on delivery' : 'Pay at counter'
}

function placeLabel(signedIn: boolean, chargedNow: number, stage: string, total: number): string {
  if (stage === 'paying') return 'Complete the payment…'
  if (stage === 'verifying') return 'Confirming payment…'
  if (!signedIn) return 'Sign in & place order'
  return chargedNow > 0 ? `Pay ₹${chargedNow}` : `Place order · ₹${total}`
}

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Cart + checkout (Phase 7.5). Review items, optionally spend coins, confirm. */
export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const current = useCart()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isAuthenticated, signInWithGoogle, user } = useAuth()
  const [useCoins, setUseCoins] = useState(false)
  const [note, setNote] = useState('')
  // The coupon the customer chose; the server's quote says whether it holds.
  const [couponCode, setCouponCode] = useState<string | null>(null)
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
  const [delivery, setDelivery] = useState<DeliveryDraft>(() => readSavedDelivery())

  // "Order at shop" covers every counter / table mode; "Home delivery" is its own.
  const shopModes: ServiceType[] = modes.filter((m) => m !== 'delivery')
  const offersDelivery = modes.includes('delivery')
  const [lastShopMode, setLastShopMode] = useState<ServiceType>('pickup')

  // How the shop takes payment -- already reconciled with the gateway on the
  // server, so whatever is offered here is something it will accept.
  const payment = service?.payment
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(() => defaultChoice(payment))
  const { data: appConfig } = useAppConfig()
  // An older API had no auth block and only ever offered Google.
  const googleSignIn = appConfig?.auth?.google ?? true

  // The customer's coin balance at this shop (only when signed in).
  const { data: loyalty } = useBusinessLoyalty(current?.businessSlug ?? '', open && isAuthenticated && Boolean(current))
  const balance = loyalty?.businessBalance ?? 0
  const coinValue = useCoinValue()

  /**
   * The sheet steps aside while Razorpay is open (see beforePaymentOpens) and
   * comes back if the payment does not go through. Coming back is not a fresh
   * cart: the address, note, coins and choices the customer set must survive,
   * so the reset below is skipped once.
   */
  const handedOff = useRef(false)
  const resuming = useRef(false)

  useEffect(() => {
    if (open) {
      if (resuming.current) {
        resuming.current = false
        return
      }
      setUseCoins(false)
      setNote('')
      setCouponCode(null)
      // Scanned a table QR ⇒ default to dine-in; else the shop's preferred mode.
      const initial: ServiceType = preboundTableId ? 'dine_in' : service?.defaultMode ?? 'pickup'
      const start = modes.includes(initial) ? initial : modes[0]
      setServiceType(start)
      setLastShopMode(start !== 'delivery' ? start : shopModes[0] ?? 'pickup')
      setTableId(preboundTableId)
      // Last address used on this device; the account's number if none saved.
      setDelivery(readSavedDelivery(user?.phone))
      setPaymentChoice(defaultChoice(payment))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isDelivery = serviceType === 'delivery'
  // Sub-choices under "Order at shop" (pickup / dine-in / takeaway) when there are several.
  const showShopModes = !isDelivery && shopModes.length > 1
  const deliveryPhone = normalisePhone(delivery.phone)
  const addressReady = !isDelivery || (delivery.address.trim().length > 0 && isValidPhone(deliveryPhone))
  const fee = isDelivery ? deliveryFee : 0

  function chooseFulfilment(next: 'shop' | 'delivery') {
    if (next === 'delivery') {
      if (serviceType !== 'delivery') setLastShopMode(serviceType)
      setServiceType('delivery')
    } else {
      setServiceType(shopModes.includes(lastShopMode) ? lastShopMode : shopModes[0] ?? 'pickup')
    }
  }

  // The server prices the cart — bill discount and coupon included — exactly as
  // the order will be; the local sums only fill in until the first quote lands.
  const { data: quote } = useCartQuote(
    open && current
      ? { business: current.businessSlug, items: orderLines(current), serviceType, couponCode: couponCode ?? undefined }
      : null,
  )
  const subtotal = quote?.subtotal ?? cartSubtotal(current)
  const savings = quote?.savings ?? 0
  const discounted = Math.max(0, subtotal - savings)
  // Coins are a combo perk: the cap is the sum of each combo's "accept up to N
  // coins" (× quantity). No coin-accepting combo ⇒ coins can't be applied.
  const comboCoinCap =
    quote?.comboCoinCap ??
    (current?.items ?? []).reduce((sum, i) => sum + (i.type === 'combo' ? (i.coinsAccepted ?? 0) * i.quantity : 0), 0)
  const coinsAccepted = comboCoinCap > 0
  const coinsToApply = useCoins
    ? Math.min(balance, comboCoinCap, Math.floor(discounted / COIN_VALUE))
    : 0
  const coinDiscount = coinsToApply * COIN_VALUE
  const payable = Math.round((Math.max(0, discounted - coinDiscount) + fee) * 100) / 100
  const totalSaved = Math.round((savings + coinDiscount) * 100) / 100
  const couponHolds = Boolean(couponCode && quote?.coupon && !quote.couponError)
  // The shop paused orders (or closed) — the menu stays browsable, checkout does not.
  const notTaking = quote?.acceptingOrders === false
  const split = splitPayment(payable, paymentChoice, payment)
  const showPaymentPicker = Boolean(payment?.onlineAvailable && payment?.codAvailable)

  // Guard the toggle: alert instead of silently doing nothing when there's
  // nothing to apply.
  function toggleCoins(next: boolean) {
    if (next && balance <= 0) {
      toast.info('You don’t have any coins at this shop yet.')
      return
    }
    setUseCoins(next)
  }

  const checkout = useOrderCheckout({
    // The sheet is a Radix modal, which blocks clicks on everything outside it
    // -- including Razorpay, which mounts into <body>. Left open, it leaves the
    // customer looking at a payment window they cannot touch. So it steps
    // aside first, and Checkout opens only once the page is clickable again.
    beforePaymentOpens: async () => {
      handedOff.current = true
      onOpenChange(false)
      await waitForPageInteractive()
    },
  })

  /** Put the cart back as the customer left it, after a payment that did not go through. */
  function resumeCart() {
    if (!handedOff.current) return
    handedOff.current = false
    resuming.current = true
    onOpenChange(true)
  }

  async function submitOrder() {
    try {
      const order = await checkout.placeOrder({
        business: current!.businessSlug,
        items: orderLines(current!),
        couponCode: couponHolds ? couponCode! : undefined,
        coinsToUse: coinsToApply,
        note: note.trim() || undefined,
        serviceType,
        table: serviceType === 'dine_in' ? tableId ?? undefined : undefined,
        serviceAddress: isDelivery ? delivery.address.trim() || undefined : undefined,
        deliveryPhone: isDelivery ? deliveryPhone : undefined,
        deliveryLat: isDelivery ? delivery.point?.lat : undefined,
        deliveryLng: isDelivery ? delivery.point?.lng : undefined,
        paymentChoice,
      })
      if (isDelivery) saveDelivery({ ...delivery, phone: deliveryPhone })

      // Placed (and paid, if it was online) → empty the cart, close the sheet,
      // and go to the orders page where the token shows.
      handedOff.current = false
      cart.clear()
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] })
      toast.success(
        order.paidOnline ? `Paid! Your token is ${order.token}.` : `Order placed! Your token is ${order.token}.`,
      )
      // Replacing the cart's history entry closes the sheet; Back then returns to the shop.
      navigate(ROUTES.orders, { replace: true })
    } catch (err) {
      // Closing the payment window is a decision, not an error: the order was
      // withdrawn and the cart is still here to try again.
      if (isOrderPaymentCancelled(err)) {
        resumeCart()
        toast.info('Payment cancelled. Your cart is still here.')
        return
      }
      resumeCart()
      toast.error(
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : MESSAGES.errors.generic,
      )
    }
  }

  async function handlePlace() {
    if (isDelivery && !delivery.address.trim()) {
      toast.info('Please add a delivery address.')
      return
    }
    if (isDelivery && !isValidPhone(deliveryPhone)) {
      toast.info('Please add a 10-digit mobile number for the delivery.')
      return
    }
    if (!isAuthenticated) {
      // With Google switched off by the admin there is no popup to open --
      // send them to the login page, which offers mobile sign-in, and back to
      // this shop afterwards. The cart is kept in storage meanwhile.
      if (!googleSignIn) {
        rememberPostLoginTarget(window.location.pathname + window.location.search)
        navigate(ROUTES.login, { replace: true, state: { from: { pathname: window.location.pathname } } })
        return
      }

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
    await submitOrder()
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
              {notTaking && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 text-caption text-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <span>
                    <b>We are not taking orders right now.</b> You can still look through the menu — please check back
                    in a little while.
                  </span>
                </div>
              )}
              {!current || current.items.length === 0 ? (
                <p className="py-8 text-center text-body text-text-muted">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {current.items.map((item) => (
                      <li key={lineKey(item)} className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-image bg-surface-muted">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <Utensils className="size-4 text-text-muted" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-medium text-foreground">{item.name}</p>
                          {item.options && (
                            <p className="truncate text-small text-text-muted">{optionsLabel(item.options)}</p>
                          )}
                          <p className="text-caption text-text-secondary">₹{item.unitPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => cart.setLineQuantity(lineKey(item), item.quantity - 1)}
                            className="grid size-7 place-items-center rounded-full border border-border text-foreground hover:bg-surface-muted"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <span className="w-5 text-center text-body font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => cart.setLineQuantity(lineKey(item), item.quantity + 1)}
                            className="grid size-7 place-items-center rounded-full border border-border text-foreground hover:bg-surface-muted"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => cart.removeLine(lineKey(item))}
                            className="ml-1 text-text-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Order at shop vs home delivery — only when the shop delivers. */}
                  {offersDelivery && (
                    <div className="space-y-2">
                      <p className="text-caption font-bold text-foreground">How would you like your order?</p>
                      <div role="radiogroup" className="relative grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1">
                        {([
                          { key: 'shop', label: 'Order at shop', hint: 'Pick up or eat here', icon: Store },
                          {
                            key: 'delivery',
                            label: 'Home delivery',
                            hint: deliveryFee > 0 ? `₹${deliveryFee} delivery` : 'Free delivery',
                            icon: Bike,
                          },
                        ] as const).map((opt) => {
                          const active = opt.key === 'delivery' ? isDelivery : !isDelivery
                          const Icon = opt.icon
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => chooseFulfilment(opt.key)}
                              className="relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                            >
                              {active && (
                                <motion.span
                                  layoutId="fulfilment-pill"
                                  className="absolute inset-0 rounded-xl bg-surface shadow-soft ring-1 ring-primary/40"
                                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                />
                              )}
                              <span
                                className={cn(
                                  'relative grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
                                  active ? 'bg-primary text-primary-foreground' : 'bg-surface text-text-muted',
                                )}
                              >
                                <Icon className="size-4" aria-hidden />
                              </span>
                              <span className="relative min-w-0">
                                <span className="block text-caption font-bold text-foreground">{opt.label}</span>
                                <span
                                  className={cn(
                                    'block truncate text-small',
                                    opt.key === 'delivery' && deliveryFee === 0 ? 'font-semibold text-success' : 'text-text-muted',
                                  )}
                                >
                                  {opt.hint}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* At the shop: pickup / dine-in / takeaway, when the shop offers more than one. */}
                  {showShopModes && (
                    <div className="space-y-2">
                      {!offersDelivery && <p className="text-caption font-medium text-foreground">How would you like it?</p>}
                      <div className="grid grid-cols-2 gap-2">
                        {shopModes.map((mode) => {
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

                  {/* Home delivery: address (typed, current location or map) + mobile. */}
                  <AnimatePresence initial={false}>
                    {isDelivery && <DeliveryDetails key="delivery" value={delivery} onChange={setDelivery} />}
                  </AnimatePresence>

                  {isAuthenticated && coinsAccepted && (
                    <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-caption font-medium text-foreground">
                          <Coins className="size-4 text-premium" aria-hidden /> Pay with my Listee wallet
                        </span>
                        <span className="text-small text-text-secondary">
                          {balance > 0
                            ? `You have ₹${(balance * coinValue).toLocaleString('en-IN')} (${balance} coins) · this offer takes up to ₹${(comboCoinCap * coinValue).toLocaleString('en-IN')}.`
                            : `Wallet empty — this offer takes up to ₹${(comboCoinCap * coinValue).toLocaleString('en-IN')} in coins.`}
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

                  {/* Rewards: the bill-discount nudge, the coupon, what this order earns. */}
                  {quote && <BillDiscountProgress quote={quote} />}
                  {quote && (
                    <CouponPicker quote={quote} applied={couponCode} onApply={setCouponCode} signedIn={isAuthenticated} />
                  )}

                  {showPaymentPicker && (
                    <div className="space-y-2">
                      <p className="text-caption font-bold text-foreground">Pay with</p>
                      <div role="radiogroup" className="grid grid-cols-2 gap-2">
                        {PAYMENT_OPTIONS.map(({ key, icon: Icon }) => {
                          const active = paymentChoice === key
                          return (
                            <button
                              key={key}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setPaymentChoice(key)}
                              className={cn(
                                'relative flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]',
                                active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong',
                              )}
                            >
                              {active && <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-primary" aria-hidden />}
                              <span className={cn('grid size-9 place-items-center rounded-xl', active ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-secondary')}>
                                <Icon className="size-5" aria-hidden />
                              </span>
                              <span className="text-caption font-bold text-foreground">
                                {key === 'online' ? 'Pay online' : codLabel(serviceType)}
                              </span>
                              <span className="text-[11px] leading-tight text-text-muted">
                                {key === 'online' ? 'UPI · Cards · Wallets' : serviceType === 'delivery' ? 'Pay when it arrives' : 'Pay when you collect'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-small text-text-muted">Same price either way — no extra charges.</p>
                    </div>
                  )}

                  {/* The bill. Savings in green, then one clear "To pay". */}
                  <div className="space-y-1.5 rounded-2xl border border-border bg-surface p-3.5">
                    <p className="text-caption font-bold text-foreground">Bill details</p>
                    <BillRow label="Item total" value={`₹${subtotal}`} />
                    {(quote?.billDiscount ?? 0) > 0 && <BillRow label="Bill discount" value={`−₹${quote!.billDiscount}`} saving />}
                    {couponHolds && <BillRow label={`Coupon (${quote!.coupon!.code})`} value={`−₹${quote!.couponDiscount}`} saving />}
                    {coinsToApply > 0 && <BillRow label={`Coins (${coinsToApply})`} value={`−₹${coinDiscount}`} saving />}
                    {isDelivery && <BillRow label="Delivery fee" value={fee > 0 ? `₹${fee}` : 'FREE'} saving={fee === 0} />}
                    {split.fee > 0 && (
                      <BillRow
                        label={
                          <span className="inline-flex items-center gap-1">
                            Payment fee <Info className="size-3" aria-label="Charged by the payment provider on online payments" />
                          </span>
                        }
                        value={`₹${split.fee}`}
                      />
                    )}
                    <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-body-lg font-extrabold text-foreground">
                      <span>To pay</span>
                      <span className="tabular-nums">₹{Math.round((payable + split.fee) * 100) / 100}</span>
                    </div>
                    {split.online > 0 && split.atCounter > 0 && (
                      <p className="text-small text-text-secondary">
                        ₹{split.chargedNow} now ({payment?.partialPercent}% advance) · ₹{split.atCounter} at the counter
                      </p>
                    )}
                  </div>

                  {totalSaved > 0 && (
                    <p className="flex items-center justify-center gap-1.5 rounded-xl bg-success-soft py-2 text-caption font-bold text-success">
                      🎉 You’re saving ₹{totalSaved} on this order
                    </p>
                  )}

                  {quote && <NextRewardHint quote={quote} />}
                </>
              )}
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={checkout.isPending}>
                Add more
              </Button>
              <Button
                className="flex-1"
                onClick={() => void handlePlace()}
                isLoading={checkout.isPending || signingIn}
                disabled={!current || current.items.length === 0 || !addressReady || notTaking}
              >
                {notTaking ? 'Not taking orders' : placeLabel(isAuthenticated, split.chargedNow, checkout.stage, payable)}
              </Button>
            </SheetFooter>
        </>
      </SheetContent>
    </Sheet>
  )
}

function BillRow({ label, value, saving }: { label: React.ReactNode; value: string; saving?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between text-caption', saving ? 'font-semibold text-success' : 'text-text-secondary')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
