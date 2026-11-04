import { useEffect } from 'react'

const BASE = 'Listee'
const DEFAULT = `${BASE} — Rewards Around You`

/**
 * What the admin's SEO settings say about the current page (set by SeoManager
 * on every route change): the site-wide title, and this page's own title if
 * the admin gave it one. A page title from the admin wins over the page's
 * built-in one, so "Nearby" can read "Shops near you in Jaipur · Listee".
 */
export const seoTitleState: { siteTitle: string | null; pageTitle: string | null } = {
  siteTitle: null,
  pageTitle: null,
}

/** The title a page should carry: the admin's, else "<page> · Listee", else the site title. */
export function resolveTitle(title?: string): string {
  if (seoTitleState.pageTitle) return seoTitleState.pageTitle
  if (title) return `${title} · ${BASE}`
  return seoTitleState.siteTitle ?? DEFAULT
}

/**
 * Set the document title for the current page (Milestone 15 — SEO). Improves
 * shareability and tab clarity in the SPA. Restores the default on unmount.
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = resolveTitle(title)
    return () => {
      document.title = seoTitleState.siteTitle ?? DEFAULT
    }
  }, [title])
}
