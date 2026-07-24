import { useSyncExternalStore } from 'react'
import { storage } from '@/utils/storage'

/**
 * Shared "ring on new order" preference (Phase 7.5). One source of truth so the
 * Orders-page toggle and the app-wide order watcher agree. Persisted so the
 * choice survives reloads; defaults ON.
 */
const KEY = 'listee.orderSound'
const listeners = new Set<() => void>()
let enabled = storage.get(KEY) !== '0'

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getOrderSound(): boolean {
  return enabled
}

export function setOrderSound(value: boolean): void {
  enabled = value
  storage.set(KEY, value ? '1' : '0')
  listeners.forEach((l) => l())
}

/** React binding for the sound preference. */
export function useOrderSound(): boolean {
  return useSyncExternalStore(subscribe, getOrderSound, getOrderSound)
}
