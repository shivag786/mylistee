/**
 * Applies the admin's SEO settings (Admin → SEO) to the page head on every
 * route change: title, description, keywords, robots, canonical URL, the Open
 * Graph / Twitter tags for shared links, the Google and Bing verification
 * tags, Google Analytics, and Organization + WebSite structured data.
 *
 * Google renders JavaScript, so it reads all of this. Crawlers that don't
 * (WhatsApp and Facebook link previews) see only index.html's static tags.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'
import { resolveTitle, seoTitleState } from '@/hooks/usePageTitle'
import { useShowsLanding } from '@/features/landing/homeEntry'
import type { SeoPageId, SeoSettings } from './seoTypes'

const PATH_PAGES: Record<string, SeoPageId> = {
  [ROUTES.landing]: 'landing',
  [ROUTES.explore]: 'explore',
  [ROUTES.nearby]: 'nearby',
  [ROUTES.deals]: 'deals',
  [ROUTES.search]: 'search',
  [ROUTES.ownerSignup]: 'ownerSignup',
  [ROUTES.login]: 'login',
}

const NO_SEO: SeoSettings = {}

const filled = (v: string | null | undefined): v is string => typeof v === 'string' && v.trim() !== ''

/** Create or update `<meta name|property=… content=…>`; remove it when there is no content. */
function setMeta(attr: 'name' | 'property', key: string, content: string | null | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!filled(content)) {
    if (el?.dataset.seo === '1') el.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.dataset.seo = '1'
    document.head.appendChild(el)
  }
  el.setAttribute('content', content.trim())
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function setJsonLd(data: object) {
  let el = document.head.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]')
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.dataset.seo = 'jsonld'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }

/** Load gtag.js once for the given GA4 id. The id is validated server-side (G-XXXX). */
function ensureAnalytics(id: string) {
  const w = window as GtagWindow
  if (document.querySelector(`script[data-ga="${id}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  script.dataset.ga = id
  document.head.appendChild(script)
  w.dataLayer = w.dataLayer ?? []
  w.gtag = function gtag() {
    // gtag.js reads the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag('js', new Date())
  // Page views are sent by hand on each route change (an SPA has one real load).
  w.gtag('config', id, { send_page_view: false })
}

export function SeoManager() {
  const location = useLocation()
  const { data: config } = useAppConfig()
  const showsLanding = useShowsLanding()
  const seo = config?.seo ?? NO_SEO

  const pageId: SeoPageId | null =
    location.pathname === ROUTES.home ? (showsLanding ? 'landing' : 'explore') : (PATH_PAGES[location.pathname] ?? null)
  const page = pageId ? seo.pages?.[pageId] : undefined

  useEffect(() => {
    const siteTitle = filled(seo.siteTitle) ? seo.siteTitle.trim() : null
    seoTitleState.siteTitle = siteTitle
    seoTitleState.pageTitle = filled(page?.title) ? page.title.trim() : null
    // Pages set their own title in an effect; this re-applies the admin's
    // override for pages already mounted (the override wins either way).
    if (seoTitleState.pageTitle || pageId === 'landing') document.title = resolveTitle()

    const description = filled(page?.description) ? page.description : seo.description
    const url = `${window.location.origin}${location.pathname}`
    const shareTitle = seoTitleState.pageTitle ?? siteTitle ?? document.title

    setMeta('name', 'description', description)
    setMeta('name', 'keywords', seo.keywords)
    setMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', shareTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', shareTitle)
    setMeta('name', 'twitter:description', description)
    if (filled(seo.ogImageUrl)) {
      setMeta('property', 'og:image', seo.ogImageUrl)
      setMeta('name', 'twitter:image', seo.ogImageUrl)
    }
    setMeta('name', 'google-site-verification', seo.googleVerification)
    setMeta('name', 'msvalidate.01', seo.bingVerification)
    // Query strings (?q=…) would make every search its own page in the index.
    setCanonical(url)
  }, [location.pathname, pageId, page?.title, page?.description, seo])

  // Structured data: who runs the site, and that it has a search box.
  useEffect(() => {
    const origin = window.location.origin
    setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          name: 'Listee',
          url: `${origin}/`,
          logo: `${origin}/pwa-512x512.png`,
        },
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          url: `${origin}/`,
          name: filled(seo.siteTitle) ? seo.siteTitle : 'Listee',
          description: seo.description ?? undefined,
          publisher: { '@id': `${origin}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${origin}${ROUTES.search}?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    })
  }, [seo.siteTitle, seo.description])

  // Google Analytics: loaded once an id is set, one page_view per route.
  const gaId = filled(seo.googleAnalyticsId) ? seo.googleAnalyticsId : null
  useEffect(() => {
    if (!gaId) return
    ensureAnalytics(gaId)
    const w = window as GtagWindow
    // After the page has set its title, so the hit carries the right one.
    const t = window.setTimeout(() => {
      w.gtag?.('event', 'page_view', {
        send_to: gaId,
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_location: window.location.href,
      })
    }, 300)
    return () => window.clearTimeout(t)
  }, [gaId, location.pathname, location.search])

  return null
}
