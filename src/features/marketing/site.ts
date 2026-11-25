/**
 * Public marketing site: shared constants and the routes the pre-renderer
 * turns into static HTML (so search engines and AI assistants can read them).
 */
export const SITE_URL = 'https://listee.org'
export const SITE_NAME = 'Listee'
export const COMPANY = 'Listee'
export const SUPPORT_EMAIL = 'info@listee.org'

/** Play Store pages; the admin's saved links (Settings → App store links) win when set. */
export const PLAY_FALLBACK = {
  customer: 'https://play.google.com/store/apps/details?id=org.listee.app',
  vendor: 'https://play.google.com/store/apps/details?id=org.listee.business',
}

export const MKT = {
  join: '/join',
  guides: '/guide',
  guide: (slug: string) => `/guide/${slug}`,
  cities: '/pos-software',
  city: (slug: string) => `/pos-software/${slug}`,
  types: '/billing-software',
  type: (slug: string) => `/billing-software/${slug}`,
  contact: '/contact',
}

/** Paths whose title, description and structured data the page sets itself. */
export const MARKETING_PREFIXES = ['/join', '/guide', '/pos-software', '/billing-software', '/contact']

export function isMarketingPath(path: string): boolean {
  return MARKETING_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export const abs = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`
