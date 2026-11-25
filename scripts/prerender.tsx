/**
 * Pre-renders the public marketing pages to static HTML after `vite build`.
 *
 * listee.org is a single-page app on static hosting, so without this every
 * page is an empty <div id="root"> to anything that doesn't run JavaScript —
 * which includes most AI crawlers (ChatGPT, Perplexity, Claude…) and link
 * previews. Each page below is written to dist/<path>/index.html with its own
 * title, description, canonical URL, schema.org JSON-LD and the full page
 * text; the app then takes over in the browser as usual. Also writes
 * dist/sitemap-pages.xml and dist/llms.txt.
 *
 * Run: vite-node scripts/prerender.tsx (part of `npm run build`). It never
 * fails the build — a page that can't render is skipped with a warning.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import React, { type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrerenderContext } from '@/features/marketing/ui'
import { fullTitle, jsonLdFor, type PageMeta } from '@/features/marketing/seo'
import { abs, MKT, SITE_URL } from '@/features/marketing/site'
import { CITIES } from '@/features/marketing/cities'
import { BUSINESS_TYPES } from '@/features/marketing/businessTypes'
import { GENERAL_FAQS, GUIDES } from '@/features/marketing/guides'
import { JoinPage, joinMeta } from '@/pages/marketing/JoinPage'
import { GuideContent, GuideHubPage, guideMeta, guidesMeta } from '@/pages/marketing/GuidePages'
import {
  CityContent,
  CityHubPage,
  ContactPage,
  TypeContent,
  TypeHubPage,
  cityMeta,
  citiesMeta,
  contactMeta,
  typeMeta,
  typesMeta,
} from '@/pages/marketing/LocalPages'

const DIST = resolve(process.cwd(), 'dist')

interface PageDef {
  meta: PageMeta
  element: ReactElement
  priority: string
}

const pages: PageDef[] = [
  { meta: joinMeta, element: <JoinPage />, priority: '1.0' },
  { meta: guidesMeta, element: <GuideHubPage />, priority: '0.8' },
  ...GUIDES.map((g) => ({ meta: guideMeta(g), element: <GuideContent guide={g} />, priority: '0.7' })),
  { meta: citiesMeta, element: <CityHubPage />, priority: '0.8' },
  ...CITIES.map((c) => ({ meta: cityMeta(c), element: <CityContent city={c} />, priority: '0.7' })),
  { meta: typesMeta, element: <TypeHubPage />, priority: '0.8' },
  ...BUSINESS_TYPES.map((t) => ({ meta: typeMeta(t), element: <TypeContent type={t} />, priority: '0.7' })),
  { meta: contactMeta, element: <ContactPage />, priority: '0.6' },
]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function headFor(m: PageMeta): string {
  const title = esc(fullTitle(m.title))
  const desc = esc(m.description)
  const url = abs(m.path)
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<script type="application/ld+json" data-seo="page-jsonld">${JSON.stringify(jsonLdFor(m)).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

function inject(template: string, m: PageMeta, body: string): string {
  let html = template
    // Drop the generic tags this page replaces.
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+property="og:(title|description|url)"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:(title|description)"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
  html = html.replace('</head>', `    ${headFor(m)}\n  </head>`)
  return html.replace(/<div id="root"><\/div>/, `<div id="root" data-prerendered="1">${body}</div>`)
}

function render(el: ReactElement, path: string): string {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })
  return renderToString(
    <PrerenderContext.Provider value>
      <QueryClientProvider client={qc}>
        <StaticRouter location={path}>{el}</StaticRouter>
      </QueryClientProvider>
    </PrerenderContext.Provider>,
  )
}

function main() {
  const templatePath = join(DIST, 'index.html')
  if (!existsSync(templatePath)) {
    console.warn('[prerender] dist/index.html not found — run vite build first. Skipping.')
    return
  }
  const template = readFileSync(templatePath, 'utf8')
  let ok = 0
  const done: PageDef[] = []

  for (const p of pages) {
    try {
      const html = inject(template, p.meta, render(p.element, p.meta.path))
      const out = join(DIST, p.meta.path.replace(/^\//, ''), 'index.html')
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, html)
      done.push(p)
      ok++
    } catch (e) {
      console.warn(`[prerender] skipped ${p.meta.path}: ${(e as Error).message}`)
    }
  }

  // Sitemap of the pre-rendered pages (robots.txt points to it).
  const today = new Date().toISOString().slice(0, 10)
  writeFileSync(
    join(DIST, 'sitemap-pages.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      done.map((p) => `  <url><loc>${abs(p.meta.path)}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n') +
      '\n</urlset>\n',
  )

  // llms.txt: a plain summary for AI assistants (https://llmstxt.org).
  const llms = [
    '# Listee',
    '',
    '> Listee (listee.org) is a POS billing, ordering and customer-rewards app for local shops in India — restaurants, bakeries, cafés, sweet shops, kirana stores, cloud kitchens, salons, medical and clothing stores. Free to start, no commission on orders. Android apps: "Listee Business" for shop owners and "Listee" for customers.',
    '',
    '## What Listee does',
    '- POS billing with GST invoices (CGST/SGST), discounts, cash/UPI/card, Bluetooth and Wi-Fi thermal printers, kitchen tickets (KOT)',
    '- Table QR ordering and online orders through the shop’s own link, without delivery-app commission',
    '- AI menu scan (photo of a menu → products), combos, staff logins and attendance, day-close reports',
    '- Customer rewards: spin & win on every QR scan, loyalty coins, coupons, birthday offers',
    '- Offer notifications and WhatsApp offers to a shop’s own customers; AI growth advisor',
    '- Works on any Android phone, in Hindi and English, in cities, small towns and villages across India',
    '',
    '## Key pages',
    `- [Join Listee](${abs(MKT.join)}): features, apps, pricing, demo`,
    `- [Guides](${abs(MKT.guides)}): step-by-step help for the Listee Business app`,
    ...GUIDES.map((g) => `- [${g.title}](${abs(MKT.guide(g.slug))}): ${g.summary}`),
    `- [POS software by city](${abs(MKT.cities)}): ${CITIES.map((c) => c.name).join(', ')}`,
    `- [Billing software by shop type](${abs(MKT.types)}): ${BUSINESS_TYPES.map((t) => t.short).join(', ')}`,
    `- [Contact](${abs(MKT.contact)}): free demo, partners, support — info@listee.org`,
    '',
    '## FAQ',
    ...GENERAL_FAQS.map(([q, a]) => `- **${q}** ${a}`),
    '',
  ].join('\n')
  writeFileSync(join(DIST, 'llms.txt'), llms)

  console.log(`[prerender] ${ok}/${pages.length} pages written for ${SITE_URL}, plus sitemap-pages.xml and llms.txt`)
}

try {
  main()
} catch (e) {
  console.warn('[prerender] failed, site still works as a normal SPA:', (e as Error).message)
}
