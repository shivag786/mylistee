import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Search, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/features/owner/hooks/useProducts'
import { useTables } from '@/features/owner/hooks/useServiceSettings'
import { useEditOrder } from '@/features/owner/hooks/useOrders'
import type { Order, OrderEditInput } from '@/features/owner/orderTypes'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'

interface Added {
  key: string
  productId: string
  variant?: string
  name: string
  price: number
  quantity: number
}

/**
 * POS: change an order still in play -- move it to another table, change or
 * remove items, and add more from the menu. The server works the bill out again.
 */
export function EditOrderDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { data: tables } = useTables()
  const { data: products } = useProducts()
  const edit = useEditOrder()
  const [table, setTable] = useState<string | null | undefined>(undefined)
  const [qty, setQty] = useState<Record<number, number>>({})
  const [added, setAdded] = useState<Added[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setTable(undefined)
    setQty({})
    setAdded([])
    setSearch('')
  }, [order?.id])

  const activeTables = (tables ?? []).filter((t) => t.status === 'active')
  const currentTableId = activeTables.find((t) => t.label === order?.tableLabel)?.id ?? null
  const pickedTable = table === undefined ? currentTableId : table

  const menu = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? [])
      .filter((p) => p.isVisible && p.inStock)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 30)
  }, [products, search])

  if (!order) return null

  const lines = order.items.filter((i) => i.id !== undefined)
  const changedQty = Object.entries(qty).filter(([id, q]) => lines.find((l) => l.id === Number(id))?.quantity !== q)
  const tableChanged = table !== undefined && table !== currentTableId
  const dirty = tableChanged || changedQty.length > 0 || added.length > 0
  const estimate =
    lines.reduce((sum, l) => sum + l.unitPrice * (qty[l.id!] ?? l.quantity), 0) +
    added.reduce((sum, a) => sum + a.price * a.quantity, 0)

  function add(productId: string, name: string, price: number, variant?: string) {
    const key = `${productId}:${variant ?? ''}`
    setAdded((list) => {
      const hit = list.find((a) => a.key === key)
      if (hit) return list.map((a) => (a.key === key ? { ...a, quantity: a.quantity + 1 } : a))
      return [...list, { key, productId, variant, name, price, quantity: 1 }]
    })
  }

  function save() {
    if (!order) return
    const input: OrderEditInput = {}
    if (tableChanged) input.table = table ?? null
    if (changedQty.length) input.quantities = Object.fromEntries(changedQty.map(([id, q]) => [id, q]))
    if (added.length) {
      input.add = added.map((a) => ({ type: 'product', id: a.productId, quantity: a.quantity, variant: a.variant }))
    }
    edit.mutate(
      { id: order.id, input },
      {
        onSuccess: (o) => {
          toast.success(`Order #${o.token} updated · ₹${o.total}`)
          onClose()
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit order #{order.token}
            {order.serial ? <span className="ml-2 text-text-muted">· No. {order.serial}</span> : null}
          </DialogTitle>
          <DialogDescription>Change the table, the items or add more. The bill updates by itself.</DialogDescription>
        </DialogHeader>

        {order.serviceType !== 'delivery' && activeTables.length > 0 && (
          <section className="space-y-2">
            <p className="text-caption font-semibold text-foreground">Table</p>
            <div className="flex flex-wrap gap-2">
              {activeTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTable(t.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-caption font-bold transition-colors',
                    pickedTable === t.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:bg-surface-muted',
                  )}
                >
                  {t.label}
                </button>
              ))}
              {pickedTable && (
                <button type="button" onClick={() => setTable(null)} className="px-2 text-caption text-text-muted underline">
                  No table
                </button>
              )}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <p className="text-caption font-semibold text-foreground">Items</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {lines.map((l) => {
              const q = qty[l.id!] ?? l.quantity
              return (
                <li key={l.id} className={cn('flex items-center gap-2 px-3 py-2', q === 0 && 'opacity-50')}>
                  <span className={cn('min-w-0 flex-1 truncate text-caption', q === 0 && 'line-through')}>{l.name}</span>
                  <Stepper value={q} onChange={(v) => setQty((s) => ({ ...s, [l.id!]: v }))} />
                  <span className="w-16 text-right text-caption tabular-nums">₹{l.unitPrice * q}</span>
                </li>
              )
            })}
            {added.map((a) => (
              <li key={a.key} className="flex items-center gap-2 bg-success/5 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-caption font-medium text-success">+ {a.name}</span>
                <Stepper
                  value={a.quantity}
                  onChange={(v) =>
                    setAdded((list) => (v === 0 ? list.filter((x) => x.key !== a.key) : list.map((x) => (x.key === a.key ? { ...x, quantity: v } : x))))
                  }
                />
                <span className="w-16 text-right text-caption tabular-nums">₹{a.price * a.quantity}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <p className="text-caption font-semibold text-foreground">Add from menu</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes" className="pl-9" />
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {menu.map((p) =>
              p.variants.length > 0 ? (
                <div key={p.id} className="flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5">
                  <span className="mr-1 text-caption font-medium">{p.name}</span>
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => add(p.id, `${p.name} (${v.name})`, v.sellingPrice, v.id)}
                      className="rounded-full border border-border px-2.5 py-1 text-small hover:bg-surface-muted"
                    >
                      {v.name} ₹{v.sellingPrice}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p.id, p.name, p.effectivePrice ?? p.sellingPrice)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-caption hover:bg-surface-muted"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="flex items-center gap-1 text-text-secondary">
                    ₹{p.effectivePrice ?? p.sellingPrice} <Plus className="size-3.5 text-primary" />
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-caption text-text-secondary">
            Items ≈ <span className="font-bold text-foreground">₹{Math.round(estimate)}</span>
            <span className="block text-small text-text-muted">Discounts are worked out on save</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
            <Button variant="success" size="md" isLoading={edit.isPending} disabled={!dirty} onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border">
      <button
        type="button"
        aria-label={value <= 1 ? 'Remove' : 'Less'}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="grid size-7 place-items-center text-text-secondary"
      >
        {value <= 1 ? <Trash2 className="size-3.5 text-destructive" /> : <Minus className="size-3.5" />}
      </button>
      <span className="w-6 text-center text-caption font-bold tabular-nums">{value}</span>
      <button type="button" aria-label="More" onClick={() => onChange(Math.min(99, value + 1))} className="grid size-7 place-items-center text-primary">
        <Plus className="size-3.5" />
      </button>
    </span>
  )
}
