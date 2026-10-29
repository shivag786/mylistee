import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bluetooth, Minus, Plus, Printer, Search, Settings2, ShoppingCart, Ticket, Trash2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/feedback/Spinner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useProducts } from '@/features/owner/hooks/useProducts'
import { useCombos } from '@/features/owner/hooks/useCombos'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import type { Product } from '@/features/owner/productTypes'
import type { Order } from '@/features/owner/orderTypes'
import { apiClient } from '@/services/apiClient'
import {
  bluetoothSupported,
  connectBluetoothPrinter,
  connectedPrinterName,
  loadPrinter,
  orderPages,
  printPages,
  savePrinter,
  type PrinterSettings,
} from '@/features/pos/printing'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

interface Line {
  key: string
  type: 'product' | 'combo'
  id: string
  name: string
  unitPrice: number
  imageUrl: string | null
  variant?: string
  addons?: string[]
  quantity: number
}

interface QuoteCoupon {
  code: string
  title: string | null
  label: string
  personal: boolean
  minBill: number | null
  minBillMet: boolean
  saves: number
}

interface Quote {
  subtotal: number
  billDiscount: number
  couponDiscount: number
  couponError: string | null
  deliveryFee: number
  total: number
  coupons: QuoteCoupon[]
  customer: { name: string } | null
}

const SERVICE_LABELS: Record<string, string> = { pickup: 'Pickup', takeaway: 'Takeaway', dine_in: 'Dine-in', delivery: 'Delivery' }

const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const mobileOk = (s: string) => /^[6-9]\d{9}$/.test(s)

function fail(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : MESSAGES.errors.generic)
}

/**
 * POS — bill a walk-in customer from the counter: tap items, take the
 * mobile number, apply their coupon, take cash or UPI, then print the bill
 * (and a kitchen ticket) on the shop's receipt printer.
 */
export function PosPage() {
  usePageTitle('POS')
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useProducts()
  const { data: combos = [] } = useCombos()
  const { data: business } = useOwnerBusiness()
  const { data: service } = useQuery({
    queryKey: ['pos-service-settings'],
    queryFn: () => apiClient.get<{ modes?: string[] }>('business/service-settings').catch(() => ({ modes: ['pickup'] })),
  })
  const modes = useMemo(() => (service?.modes?.length ? service.modes : ['pickup']), [service])

  const [query, setQuery] = useState('')
  const [section, setSection] = useState('All')
  const [cart, setCart] = useState<Line[]>([])
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [mode, setMode] = useState<string>('pickup')
  const [address, setAddress] = useState('')
  const [coupon, setCoupon] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState<Product | null>(null)
  const [printerOpen, setPrinterOpen] = useState(false)
  const [printer, setPrinter] = useState<PrinterSettings>(loadPrinter)
  const [cartOpen, setCartOpen] = useState(false)
  const [last, setLast] = useState<Order | null>(null)

  useEffect(() => {
    if (!modes.includes(mode)) setMode(modes.includes('pickup') ? 'pickup' : modes[0])
  }, [modes, mode])

  const sellable = products.filter((p) => p.isVisible && p.inStock)
  const liveCombos = combos.filter((c) => c.isVisible && c.isActiveNow)
  const sections = ['All', ...(liveCombos.length ? ['Combos'] : []), ...new Set(sellable.map((p) => p.categoryName ?? 'Other'))]
  const q = query.trim().toLowerCase()
  const shownProducts = section === 'Combos' ? [] : sellable.filter((p) => (section === 'All' || (p.categoryName ?? 'Other') === section) && (!q || p.name.toLowerCase().includes(q)))
  const shownCombos = section === 'All' || section === 'Combos' ? liveCombos.filter((c) => !q || c.name.toLowerCase().includes(q)) : []

  const count = cart.reduce((s, l) => s + l.quantity, 0)
  const localTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0)

  // The server's price for this cart and customer (coupons, bill discount).
  const seq = useRef(0)
  const cartKey = JSON.stringify(cart.map((l) => [l.key, l.quantity]))
  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null)
      return
    }
    const n = ++seq.current
    const t = setTimeout(() => {
      apiClient
        .post<Quote>('business/orders/quote', {
          items: cart.map(apiLine),
          serviceType: mode,
          customerPhone: mobileOk(phone) ? phone : undefined,
          couponCode: coupon ?? undefined,
        })
        .then((data) => {
          if (n !== seq.current) return
          if (data.couponError && coupon) {
            toast.error(data.couponError)
            setCoupon(null)
          }
          setQuote(data)
          if (data.customer?.name && !name) setName(data.customer.name)
        })
        .catch(() => n === seq.current && setQuote(null))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, mode, phone, coupon])

  function add(line: Omit<Line, 'key' | 'quantity'> & { quantity?: number }) {
    const key = [line.type, line.id, line.variant ?? '', [...(line.addons ?? [])].sort().join(',')].join('|')
    setCart((c) => {
      const found = c.find((l) => l.key === key)
      if (found) return c.map((l) => (l.key === key ? { ...l, quantity: l.quantity + (line.quantity ?? 1) } : l))
      return [...c, { ...line, key, quantity: line.quantity ?? 1 }]
    })
  }

  function change(key: string, by: number) {
    setCart((c) => c.flatMap((l) => (l.key !== key ? [l] : l.quantity + by > 0 ? [{ ...l, quantity: l.quantity + by }] : [])))
  }

  function tapProduct(p: Product) {
    if (p.variants.length || p.addons.length) setPicking(p)
    else add({ type: 'product', id: p.id, name: p.name, unitPrice: p.effectivePrice ?? p.sellingPrice, imageUrl: p.imageUrl })
  }

  function reset() {
    setCart([])
    setPhone('')
    setName('')
    setNote('')
    setAddress('')
    setCoupon(null)
    setQuote(null)
  }

  async function save(paid: 'cod' | 'online' | null, print: boolean) {
    if (!mobileOk(phone)) return toast.error('Enter the customer’s 10-digit mobile number.')
    if (mode === 'delivery' && !address.trim()) return toast.error('Add the delivery address.')
    setSaving(true)
    try {
      const order = await apiClient.post<Order>('business/orders', {
        items: cart.map(apiLine),
        serviceType: mode,
        customerPhone: phone,
        couponCode: coupon ?? undefined,
        customerName: name.trim() || undefined,
        note: note.trim() || undefined,
        serviceAddress: mode === 'delivery' ? address.trim() : undefined,
        paid: paid ?? undefined,
      })
      toast.success(`Order #${order.token} saved`)
      setLast(order)
      reset()
      setCartOpen(false)
      void qc.invalidateQueries({ queryKey: ['owner'] })
      if (print || printer.autoPrint) await doPrint(order, 'both')
    } catch (err) {
      fail(err)
    } finally {
      setSaving(false)
    }
  }

  async function doPrint(order: Order, what: 'bill' | 'kot' | 'both') {
    try {
      await printPages(
        orderPages(order, { name: business?.name ?? 'Bill', address: business?.address, phone: business?.phone }, printer, what),
        printer,
      )
    } catch (err) {
      fail(err)
    }
  }

  const coupons = quote?.coupons ?? []
  const total = quote?.total ?? localTotal

  const cartPanel = (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-body font-bold text-foreground">Bill ({count} items)</p>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="py-6 text-center text-caption text-text-secondary">Tap items to add them to the bill.</p>
      ) : (
        <ul className="max-h-[38vh] space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:flex-none">
          {cart.map((l) => (
            <li key={l.key} className="flex items-center gap-2">
              <Thumb src={l.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-foreground">{l.name}</p>
                <p className="text-small text-text-secondary">{money(l.unitPrice * l.quantity)}</p>
              </div>
              <div className="flex items-center rounded-lg border border-primary">
                <button type="button" aria-label="One less" onClick={() => change(l.key, -1)} className="grid size-7 place-items-center text-primary">
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center text-caption font-bold">{l.quantity}</span>
                <button type="button" aria-label="One more" onClick={() => change(l.key, 1)} className="grid size-7 place-items-center text-primary">
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                aria-label={`Remove ${l.name}`}
                onClick={() => change(l.key, -l.quantity)}
                className="ml-1.5 grid size-8 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="pos-phone">Mobile *</Label>
          <Input id="pos-phone" inputMode="numeric" value={phone} placeholder="10 digits" onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pos-name">Name</Label>
          <Input id="pos-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>
      {quote?.customer && <p className="-mt-1 text-small font-semibold text-success">✓ Listee customer · {quote.customer.name}</p>}

      {coupons.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-small font-bold text-foreground">{quote?.customer ? 'Coupons for this customer' : 'Shop coupons'}</p>
          {coupons.map((c) => (
            <div key={c.code} className={cn('flex items-center gap-2 rounded-xl border p-2', coupon === c.code ? 'border-success bg-success-soft' : 'border-border')}>
              <Ticket className="size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-caption font-bold">
                  {c.code} {c.personal && <Badge tone="warning" size="sm">Earned</Badge>}
                </p>
                <p className="truncate text-small text-text-secondary">
                  {c.minBillMet ? `Saves ${money(c.saves)}` : `Needs a bill of ${money(c.minBill ?? 0)}`}
                </p>
              </div>
              <Button size="sm" variant={coupon === c.code ? 'ghost' : 'outline'} disabled={!c.minBillMet && coupon !== c.code} onClick={() => setCoupon(coupon === c.code ? null : c.code)}>
                {coupon === c.code ? 'Remove' : 'Apply'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {modes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {modes.map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cn('rounded-full border px-3 py-1 text-small font-semibold', mode === m ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-secondary')}>
              {SERVICE_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      )}
      {mode === 'delivery' && <Input value={address} placeholder="Delivery address *" onChange={(e) => setAddress(e.target.value)} />}
      <Input value={note} placeholder="Note for kitchen (optional)" maxLength={300} onChange={(e) => setNote(e.target.value)} />

      <div className="space-y-0.5 border-t border-border pt-2 text-caption">
        <Row label="Items" value={money(quote?.subtotal ?? localTotal)} />
        {!!quote?.billDiscount && <Row label="Shop discount" value={`−${money(quote.billDiscount)}`} green />}
        {!!quote?.couponDiscount && <Row label={`Coupon ${coupon ?? ''}`} value={`−${money(quote.couponDiscount)}`} green />}
        {!!quote?.deliveryFee && <Row label="Delivery" value={money(quote.deliveryFee)} />}
        <div className="flex items-center justify-between pt-1 text-body font-extrabold text-foreground">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button disabled={!cart.length} isLoading={saving} onClick={() => void save('cod', true)} leftIcon={<Printer className="size-4" />}>
          Cash · print
        </Button>
        <Button disabled={!cart.length} isLoading={saving} onClick={() => void save('online', true)} leftIcon={<Printer className="size-4" />}>
          UPI · print
        </Button>
        <Button variant="outline" disabled={!cart.length || saving} onClick={() => void save(null, false)}>
          Pay later
        </Button>
        <Button variant="outline" disabled={!cart.length || saving} onClick={() => void save('cod', false)}>
          Cash · no print
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-3 pb-24 lg:pb-4">
      <header className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-title font-bold text-foreground">POS · New bill</h1>
          <p className="text-caption text-text-secondary">Bill a walk-in customer and print the receipt.</p>
        </div>
        {last && (
          <Button variant="outline" size="sm" leftIcon={<Printer className="size-4" />} onClick={() => void doPrint(last, 'bill')}>
            Reprint #{last.token}
          </Button>
        )}
        <Button variant="outline" size="sm" leftIcon={<Settings2 className="size-4" />} onClick={() => setPrinterOpen(true)}>
          Printer
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item" className="pl-9" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {sections.map((s) => (
              <button key={s} type="button" onClick={() => setSection(s)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-small font-semibold', section === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-text-secondary')}>
                {s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={28} label="Loading items" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {shownCombos.map((c) => (
                <ItemTile
                  key={`c-${c.id}`}
                  name={c.name}
                  price={c.comboPrice}
                  image={c.imageUrl ?? c.items.find((i) => i.imageUrl)?.imageUrl ?? null}
                  badge="Combo"
                  qty={cart.filter((l) => l.type === 'combo' && l.id === c.id).reduce((s, l) => s + l.quantity, 0)}
                  onTap={() => add({ type: 'combo', id: c.id, name: c.name, unitPrice: c.comboPrice, imageUrl: c.imageUrl })}
                />
              ))}
              {shownProducts.map((p) => (
                <ItemTile
                  key={p.id}
                  name={p.name}
                  price={p.variants.length ? Math.min(...p.variants.map((v) => v.sellingPrice)) : (p.effectivePrice ?? p.sellingPrice)}
                  from={p.variants.length > 1}
                  image={p.imageUrl}
                  qty={cart.filter((l) => l.type === 'product' && l.id === p.id).reduce((s, l) => s + l.quantity, 0)}
                  onTap={() => tapProduct(p)}
                />
              ))}
              {shownCombos.length + shownProducts.length === 0 && (
                <p className="col-span-full py-8 text-center text-caption text-text-secondary">No items here.</p>
              )}
            </div>
          )}
        </div>

        {/* Desktop: the bill alongside. */}
        <Card padding="md" className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] self-start overflow-y-auto lg:block">
          {cartPanel}
        </Card>
      </div>

      {/* Phone: a bar that opens the bill. */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-4 lg:hidden">
          <button type="button" onClick={() => setCartOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-foreground px-4 py-3.5 text-background shadow-premium">
            <ShoppingCart className="size-5" aria-hidden />
            <span className="font-bold">{count} items</span>
            <span className="ml-auto text-body font-extrabold">{money(total)}</span>
          </button>
        </div>
      )}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill</DialogTitle>
            <DialogDescription>Check the items, take the mobile number and the payment.</DialogDescription>
          </DialogHeader>
          {cartPanel}
        </DialogContent>
      </Dialog>

      <OptionsDialog
        product={picking}
        onClose={() => setPicking(null)}
        onAdd={(line) => {
          add(line)
          setPicking(null)
        }}
      />
      <PrinterDialog
        open={printerOpen}
        settings={printer}
        onClose={() => setPrinterOpen(false)}
        onChange={(s) => {
          setPrinter(s)
          savePrinter(s)
        }}
        onTest={() =>
          void doPrint(
            {
              id: 'test', token: 'TEST', status: 'paid', serviceType: 'pickup', serviceLabel: 'Test print', paymentMethod: 'cod',
              paymentLabel: 'Cash', tableLabel: null, serviceAddress: null, subtotal: 100, coinsUsed: 0, coinDiscount: 0,
              deliveryFee: 0, total: 100, coinsEarned: 0, note: 'Printer works!', placedAt: new Date().toISOString(),
              confirmedAt: null, paidAt: null, completedAt: null, createdAt: null,
              items: [{ name: 'Sample item', itemType: 'product', unitPrice: 100, quantity: 1, lineTotal: 100 }],
            },
            'both',
          )
        }
      />
    </div>
  )
}

function apiLine(l: Line) {
  return { type: l.type, id: l.id, quantity: l.quantity, variant: l.variant, addons: l.addons?.length ? l.addons : undefined }
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between', green ? 'text-success' : 'text-text-secondary')}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg object-cover" />
  ) : (
    <span className="size-10 shrink-0 rounded-lg bg-surface-muted" />
  )
}

function ItemTile({ name, price, from, image, badge, qty, onTap }: { name: string; price: number; from?: boolean; image: string | null; badge?: string; qty: number; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-left transition-transform active:scale-[0.98]',
        qty > 0 ? 'border-2 border-primary' : 'border-border',
      )}
    >
      {image ? (
        <img src={image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <span className="grid aspect-[4/3] w-full place-items-center bg-surface-muted text-title font-bold text-text-muted">{name.charAt(0)}</span>
      )}
      {badge && <Badge tone="premium" size="sm" className="absolute left-2 top-2">{badge}</Badge>}
      {qty > 0 && (
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-caption font-extrabold text-primary-foreground">{qty}</span>
      )}
      <span className="p-2">
        <span className="line-clamp-2 text-caption font-semibold text-foreground">{name}</span>
        <span className="block text-caption font-extrabold">{from ? 'from ' : ''}{money(price)}</span>
      </span>
    </button>
  )
}

function OptionsDialog({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (line: Omit<Line, 'key'>) => void }) {
  const [variant, setVariant] = useState<string | undefined>()
  const [addons, setAddons] = useState<string[]>([])
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setVariant(product?.variants[0]?.id)
    setAddons([])
    setQty(1)
  }, [product])

  const unit = useMemo(() => {
    if (!product) return 0
    const v = product.variants.find((x) => x.id === variant)
    const base = v ? v.sellingPrice : (product.effectivePrice ?? product.sellingPrice)
    return base + product.addons.filter((a) => a.id && addons.includes(a.id)).reduce((s, a) => s + a.price, 0)
  }, [product, variant, addons])

  if (!product) return null
  const v = product.variants.find((x) => x.id === variant)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Pick the size and add-ons.</DialogDescription>
        </DialogHeader>
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.variants.map((x) => (
              <button key={x.id} type="button" onClick={() => setVariant(x.id)} className={cn('rounded-xl border px-3 py-2 text-caption font-semibold', variant === x.id ? 'border-primary bg-primary-soft text-primary' : 'border-border')}>
                {x.name} · {money(x.sellingPrice)}
              </button>
            ))}
          </div>
        )}
        {product.addons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-caption font-bold">Add-ons</p>
            {product.addons.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  checked={!!a.id && addons.includes(a.id)}
                  onChange={(e) => a.id && setAddons(e.target.checked ? [...addons, a.id] : addons.filter((x) => x !== a.id))}
                />
                <span className="flex-1">{a.name}</span>
                <span>+{money(a.price)}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="One less"><Minus className="size-4" /></Button>
          <span className="w-6 text-center font-bold">{qty}</span>
          <Button variant="outline" size="sm" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="One more"><Plus className="size-4" /></Button>
          <span className="ml-auto text-body font-extrabold">{money(unit * qty)}</span>
        </div>
        <DialogFooter>
          <Button
            fullWidth
            onClick={() =>
              onAdd({
                type: 'product',
                id: product.id,
                name: v ? `${product.name} (${v.name})` : product.name,
                unitPrice: unit,
                imageUrl: product.imageUrl,
                variant,
                addons,
                quantity: qty,
              })
            }
          >
            Add to bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PrinterDialog({
  open,
  settings,
  onClose,
  onChange,
  onTest,
}: {
  open: boolean
  settings: PrinterSettings
  onClose: () => void
  onChange: (s: PrinterSettings) => void
  onTest: () => void
}) {
  const [btName, setBtName] = useState<string | null>(connectedPrinterName())
  const [connecting, setConnecting] = useState(false)

  async function connect() {
    setConnecting(true)
    try {
      setBtName(await connectBluetoothPrinter())
      onChange({ ...settings, mode: 'bluetooth' })
      toast.success('Printer connected')
    } catch (err) {
      if (!(err instanceof Error && err.name === 'NotFoundError')) fail(err)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt printer</DialogTitle>
          <DialogDescription>Saved on this computer or phone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['browser', 'Browser print', 'USB, Wi-Fi or Bluetooth printer added to this computer'],
                ['bluetooth', 'Bluetooth (direct)', 'BLE thermal printer, straight from Chrome'],
              ] as const
            ).map(([m, title, hint]) => (
              <button key={m} type="button" onClick={() => onChange({ ...settings, mode: m })} className={cn('rounded-xl border p-3 text-left', settings.mode === m ? 'border-primary bg-primary-soft' : 'border-border')}>
                <span className="block text-caption font-bold">{title}</span>
                <span className="block text-small text-text-secondary">{hint}</span>
              </button>
            ))}
          </div>

          {settings.mode === 'bluetooth' && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
              <Bluetooth className="size-5 text-info" aria-hidden />
              <p className="min-w-0 flex-1 text-caption">
                {!bluetoothSupported()
                  ? 'This browser can’t reach Bluetooth. Use Chrome, or Browser print.'
                  : btName
                    ? `Connected: ${btName}`
                    : 'Not connected. Turn the printer on and connect.'}
              </p>
              {bluetoothSupported() && (
                <Button size="sm" isLoading={connecting} onClick={() => void connect()}>
                  {btName ? 'Change' : 'Connect'}
                </Button>
              )}
            </div>
          )}
          {settings.mode === 'browser' && (
            <p className="rounded-xl bg-surface-muted p-3 text-small text-text-secondary">
              Add the receipt printer to this computer once (Settings → Printers; Wi-Fi printers by their IP). In the print
              window pick it, set margins to “None”, and tick “Always use” so the next bills print faster.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Paper width</Label>
            <div className="flex gap-2">
              {([58, 80] as const).map((w) => (
                <button key={w} type="button" onClick={() => onChange({ ...settings, paper: w })} className={cn('flex-1 rounded-lg border py-2 text-caption font-bold', settings.paper === w ? 'border-primary bg-primary-soft text-primary' : 'border-border')}>
                  {w} mm
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="text-caption font-semibold">Print the bill every time an order is saved</span>
            <Switch checked={settings.autoPrint} onCheckedChange={(v) => onChange({ ...settings, autoPrint: v })} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-caption font-semibold">Also print a kitchen ticket (KOT)</span>
            <Switch checked={settings.kot} onCheckedChange={(v) => onChange({ ...settings, kot: v })} />
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="pr-footer">Message at the bottom of the bill</Label>
            <Input id="pr-footer" value={settings.footer} maxLength={80} onChange={(e) => onChange({ ...settings, footer: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" leftIcon={<Printer className="size-4" />} onClick={onTest}>
            Test print
          </Button>
          <Button onClick={onClose} leftIcon={<X className="size-4" />}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
