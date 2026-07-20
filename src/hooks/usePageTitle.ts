import { useEffect } from 'react'

const BASE = 'Listee'
const DEFAULT = `${BASE} — Rewards Around You`

/**
 * Set the document title for the current page (Milestone 15 — SEO). Improves
 * shareability and tab clarity in the SPA. Restores the default on unmount.
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : DEFAULT
    return () => {
      document.title = DEFAULT
    }
  }, [title])
}
