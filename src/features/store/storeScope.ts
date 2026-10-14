/**
 * Premium store mode. A customer who opens a premium shop by its link or QR is
 * kept inside that shop for the visit: the app shows only that shop — no home
 * feed, nearby list or other shops. Lives in sessionStorage, so a fresh launch
 * of the app (or a new tab) is the normal marketplace again, and it lapses
 * after a few hours of no use.
 */
import { useSyncExternalStore } from 'react'

export interface StoreScope {
  slug: string
  name: string
  logoUrl: string | null
  /** Last activity (ms) — the scope lapses STORE_TTL after it. */
  at: number
}

const KEY = 'listee.storeScope'
const STORE_TTL = 3 * 60 * 60 * 1000

const listeners = new Set<() => void>()
let cached: StoreScope | null | undefined

function read(): StoreScope | null {
  if (cached !== undefined) return cached
  try {
    const raw = sessionStorage.getItem(KEY)
    const scope = raw ? (JSON.parse(raw) as StoreScope) : null
    cached = scope && Date.now() - scope.at < STORE_TTL ? scope : null
  } catch {
    cached = null
  }
  return cached
}

function write(scope: StoreScope | null) {
  cached = scope
  try {
    if (scope) sessionStorage.setItem(KEY, JSON.stringify(scope))
    else sessionStorage.removeItem(KEY)
  } catch {
    // Private mode: the scope just lasts for this page view.
  }
  listeners.forEach((l) => l())
}

export const storeScope = {
  get: read,
  enter: (scope: Omit<StoreScope, 'at'>) => write({ ...scope, at: Date.now() }),
  /** Keep the visit alive while the customer is using it. */
  touch: () => {
    const current = read()
    if (current) write({ ...current, at: Date.now() })
  },
  leave: () => write(null),
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The shop the app is locked to right now, or null for the normal marketplace. */
export function useStoreScope(): StoreScope | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

/** Paths a store-mode visitor may open; everything else leads back to the shop. */
export function isAllowedInStore(pathname: string, slug: string): boolean {
  return (
    pathname === `/b/${slug}` ||
    pathname.startsWith(`/b/${slug}/`) ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/profile')
  )
}
