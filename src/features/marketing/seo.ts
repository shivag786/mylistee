import { useEffect } from 'react'
import { abs, COMPANY, PLAY_FALLBACK, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from './site'

export interface PageMeta {
  title: string
  description: string
  path: string
  /** Extra schema.org nodes for this page (FAQPage, HowTo, BreadcrumbList…). */
  jsonLd?: object[]
}

/** Who runs listee.org and what the apps are — on every marketing page. */
export function baseJsonLd(): object[] {
  return [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: COMPANY,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/pwa-512x512.png`,
      email: SUPPORT_EMAIL,
      areaServed: 'IN',
      contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: SUPPORT_EMAIL, areaServed: 'IN', availableLanguage: ['English', 'Hindi'] }],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#vendor-app`,
      name: 'Listee Business',
      operatingSystem: 'Android, Web',
      applicationCategory: 'BusinessApplication',
      description: 'POS billing, table QR ordering, online orders, GST invoices, customer rewards, offer notifications and an AI assistant for local shops in India.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free to start; paid plans available' },
      installUrl: PLAY_FALLBACK.vendor,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#customer-app`,
      name: 'Listee',
      operatingSystem: 'Android',
      applicationCategory: 'LifestyleApplication',
      description: 'Find local shops nearby, order, scan to spin & win, and collect rewards.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      installUrl: PLAY_FALLBACK.customer,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ]
}

export function fullTitle(title: string) {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

export function jsonLdFor(meta: PageMeta) {
  return { '@context': 'https://schema.org', '@graph': [...baseJsonLd(), ...(meta.jsonLd ?? [])] }
}

function setTag(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  apply(el)
}

const meta = (attr: 'name' | 'property', key: string, content: string) =>
  setTag(
    `meta[${attr}="${key}"]`,
    () => {
      const m = document.createElement('meta')
      m.setAttribute(attr, key)
      return m
    },
    (el) => el.setAttribute('content', content),
  )

/** Title, description, canonical, social tags and structured data for a marketing page. */
export function usePageSeo(m: PageMeta) {
  const key = `${m.path}|${m.title}`
  useEffect(() => {
    const title = fullTitle(m.title)
    document.title = title
    meta('name', 'description', m.description)
    meta('name', 'robots', 'index, follow, max-image-preview:large')
    meta('property', 'og:title', title)
    meta('property', 'og:description', m.description)
    meta('property', 'og:url', abs(m.path))
    meta('property', 'og:type', 'website')
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', m.description)
    setTag(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'canonical')
        return l
      },
      (el) => el.setAttribute('href', abs(m.path)),
    )
    setTag(
      'script[data-seo="page-jsonld"]',
      () => {
        const s = document.createElement('script')
        s.setAttribute('type', 'application/ld+json')
        s.dataset.seo = 'page-jsonld'
        return s
      },
      (el) => {
        el.textContent = JSON.stringify(jsonLdFor(m))
      },
    )
    return () => document.head.querySelector('script[data-seo="page-jsonld"]')?.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
