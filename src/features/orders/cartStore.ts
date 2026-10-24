import { useSyncExternalStore } from 'react'
import { storage } from '@/utils/storage'
import type { ServiceType } from './serviceTypes'
import type { PublicPaymentOptions } from '@/features/businesses/publicTypes'

/** A line in the cart (Phase 7.5). One shop at a time. */
export interface CartItem {
  type: 'product' | 'combo'
  id: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  /** For combos: max Listee coins spendable on this item (0/absent = none). */
  coinsAccepted?: number
  /** The size and add-ons picked, for products that have them. */
  options?: CartItemOptions
}

export interface CartItemOptions {
  variantId: string | null
  variantName: string | null
  addonIds: string[]
  addonNames: string[]
}

/**
 * One cart line per distinct pick: a Large pizza with cheese and a Small one
 * are two lines. Plain items keep the old `type:id` key.
 */
export function lineKey(item: Pick<CartItem, 'type' | 'id' | 'options'>): string {
  const o = item.options
  if (!o) return `${item.type}:${item.id}`
  return `${item.type}:${item.id}:${o.variantId ?? ''}:${[...o.addonIds].sort().join(',')}`
}

/** "Large · Extra cheese, Dip" — what a line's picks read as. */
export function optionsLabel(options?: CartItemOptions): string {
  if (!options) return ''
  return [options.variantName, options.addonNames.join(', ')].filter(Boolean).join(' · ')
}

/** The shop's service config, captured on add so the checkout sheet is self-sufficient. */
export interface CartService {
  modes: ServiceType[]
  defaultMode: ServiceType
  deliveryFee: number
  tables: { id: string; label: string }[]
  /** How this shop takes payment. Absent ⇒ cash only, as before. */
  payment?: PublicPaymentOptions
}

/** Extra context passed alongside items (service config + a scanned table). */
export interface CartContext {
  service?: CartService
  /** Table uuid pre-bound via a table-QR scan (?table=…). */
  tableId?: string | null
}

export interface Cart {
  businessSlug: string
  businessName: string
  items: CartItem[]
  /** The shop's fulfilment config (Phase 7.6). Absent ⇒ pickup-only. */
  service?: CartService
  /** Dine-in table bound from a table-QR scan, if any. */
  tableId?: string | null
}

const KEY = 'listee.cart'
const listeners = new Set<() => void>()
let current: Cart | null = load()

function load(): Cart | null {
  try {
    const raw = storage.get(KEY)
    return raw ? (JSON.parse(raw) as Cart) : null
  } catch {
    return null
  }
}

function commit(next: Cart | null) {
  current = next && next.items.length > 0 ? next : null
  if (current) storage.set(KEY, JSON.stringify(current))
  else storage.remove(KEY)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const cart = {
  get: () => current,

  /**
   * Add an item. Returns 'conflict' when the cart holds another shop's items —
   * the caller should confirm clearing first. `context` carries the shop's
   * service config and any scanned table binding (Phase 7.6).
   */
  add(
    business: { slug: string; name: string },
    item: Omit<CartItem, 'quantity'>,
    quantity = 1,
    context?: CartContext,
  ): 'ok' | 'conflict' {
    if (current && current.businessSlug !== business.slug) return 'conflict'

    const base: Cart = current ?? { businessSlug: business.slug, businessName: business.name, items: [] }
    const key = lineKey(item)
    const existing = base.items.find((i) => lineKey(i) === key)
    const items = existing
      ? base.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
      : [...base.items, { ...item, quantity }]

    commit({
      ...base,
      items,
      service: context?.service ?? base.service,
      tableId: context?.tableId !== undefined ? context.tableId : base.tableId,
    })
    return 'ok'
  },

  /** Quantity of a plain (no size / add-on) item. */
  setQuantity(type: CartItem['type'], id: string, quantity: number) {
    cart.setLineQuantity(`${type}:${id}`, quantity)
  },

  setLineQuantity(key: string, quantity: number) {
    if (!current) return
    const items = current.items
      .map((i) => (lineKey(i) === key ? { ...i, quantity: Math.max(0, quantity) } : i))
      .filter((i) => i.quantity > 0)
    commit({ ...current, items })
  },

  removeLine(key: string) {
    if (!current) return
    commit({ ...current, items: current.items.filter((i) => lineKey(i) !== key) })
  },

  /** Take an item out entirely — every size / add-on pick of it. */
  removeItem(type: CartItem['type'], id: string) {
    if (!current) return
    commit({ ...current, items: current.items.filter((i) => !(i.type === type && i.id === id)) })
  },

  /** "−" on a menu item with several picks in the cart: take one off the newest. */
  decrementLatest(type: CartItem['type'], id: string) {
    const line = current?.items.filter((i) => i.type === type && i.id === id).at(-1)
    if (line) cart.setLineQuantity(lineKey(line), line.quantity - 1)
  },

  clear() {
    commit(null)
  },

  /** Put back a cart saved before clearing it (the cart bar's Undo). */
  restore(saved: Cart) {
    commit(saved)
  },

  /** Replace the cart with a single item from a new shop (after a conflict). */
  replace(
    business: { slug: string; name: string },
    item: Omit<CartItem, 'quantity'>,
    quantity = 1,
    context?: CartContext,
  ) {
    commit({
      businessSlug: business.slug,
      businessName: business.name,
      items: [{ ...item, quantity }],
      service: context?.service,
      tableId: context?.tableId ?? null,
    })
  },
}

/** React binding for the cart. */
export function useCart(): Cart | null {
  return useSyncExternalStore(subscribe, cart.get, cart.get)
}

export function cartCount(c: Cart | null): number {
  return c?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
}

export function cartSubtotal(c: Cart | null): number {
  return c?.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) ?? 0
}

const sheetListeners = new Set<() => void>()

/** Ask the global cart bar to open its checkout sheet (e.g. from the dish viewer). */
export function openCartSheet() {
  sheetListeners.forEach((l) => l())
}

export function onOpenCartSheet(listener: () => void) {
  sheetListeners.add(listener)
  return () => {
    sheetListeners.delete(listener)
  }
}
