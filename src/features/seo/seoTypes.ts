/**
 * Search and social tags the admin sets (Settings → SEO), served in GET /config.
 * Ids mirror the backend's SettingService::SEO_PAGES.
 */
export type SeoPageId = 'landing' | 'explore' | 'nearby' | 'deals' | 'search' | 'ownerSignup' | 'login'

export interface SeoPageSetting {
  title?: string | null
  description?: string | null
}

export interface SeoSettings {
  /** The site-wide title, used for pages without their own. */
  siteTitle?: string | null
  description?: string | null
  keywords?: string | null
  /** The picture shown when a link is shared (1200 × 630 is best). */
  ogImageUrl?: string | null
  /** The code from Google Search Console's HTML-tag method. */
  googleVerification?: string | null
  bingVerification?: string | null
  /** Google Analytics 4 measurement id, G-XXXXXXXXXX. */
  googleAnalyticsId?: string | null
  /** Ask search engines not to list the site (e.g. while testing). */
  noindex?: boolean
  pages?: Partial<Record<SeoPageId, SeoPageSetting>> | null
}

export const SEO_PAGES: { id: SeoPageId; label: string; path: string }[] = [
  { id: 'landing', label: 'Landing page', path: '/' },
  { id: 'explore', label: 'Shops home', path: '/explore' },
  { id: 'nearby', label: 'Nearby', path: '/nearby' },
  { id: 'deals', label: 'Deals', path: '/deals' },
  { id: 'search', label: 'Search', path: '/search' },
  { id: 'ownerSignup', label: 'Shop sign-up', path: '/get-started' },
  { id: 'login', label: 'Customer sign-in', path: '/login' },
]
