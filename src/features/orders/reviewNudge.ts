/**
 * Persistence for the post-order review nudge (home floating card). Once a
 * customer dismisses the nudge for an order, we never show it again — no nagging.
 */
import { storage } from '@/utils/storage'

const KEY = 'listee.reviewNudge.dismissed'
const MAX = 100 // keep the list small; oldest ids fall off

function load(): string[] {
  try {
    const raw = storage.get(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function isReviewNudgeDismissed(orderId: string): boolean {
  return load().includes(orderId)
}

export function dismissReviewNudge(orderId: string): void {
  const list = load()
  if (list.includes(orderId)) return
  const next = [...list, orderId].slice(-MAX)
  storage.set(KEY, JSON.stringify(next))
}
