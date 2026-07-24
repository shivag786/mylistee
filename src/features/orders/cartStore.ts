import { useSyncExternalStore } from 'react'
import { storage } from '@/utils/storage'

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
}

export interface Cart {
  businessSlug: string
  businessName: string
  items: CartItem[]
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
   * the caller should confirm clearing first.
   */
  add(
    business: { slug: string; name: string },
    item: Omit<CartItem, 'quantity'>,
    quantity = 1,
  ): 'ok' | 'conflict' {
    if (current && current.businessSlug !== business.slug) return 'conflict'

    const base: Cart = current ?? { businessSlug: business.slug, businessName: business.name, items: [] }
    const existing = base.items.find((i) => i.type === item.type && i.id === item.id)
    const items = existing
      ? base.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
      : [...base.items, { ...item, quantity }]

    commit({ ...base, items })
    return 'ok'
  },

  setQuantity(type: CartItem['type'], id: string, quantity: number) {
    if (!current) return
    const items = current.items
      .map((i) => (i.type === type && i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))
      .filter((i) => i.quantity > 0)
    commit({ ...current, items })
  },

  remove(type: CartItem['type'], id: string) {
    if (!current) return
    commit({ ...current, items: current.items.filter((i) => !(i.type === type && i.id === id)) })
  },

  clear() {
    commit(null)
  },

  /** Replace the cart with a single item from a new shop (after a conflict). */
  replace(business: { slug: string; name: string }, item: Omit<CartItem, 'quantity'>, quantity = 1) {
    commit({ businessSlug: business.slug, businessName: business.name, items: [{ ...item, quantity }] })
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
