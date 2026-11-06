/**
 * The landing page: what `/` shows signed-out visitors when the admin picks it
 * as the home page. One page that sells Listee to both audiences — customers
 * (shops, offers, rewards near them) and shop owners (benefits, personal link,
 * plans, sign-up).
 *
 * Everything here is the built-in content. The admin's saved copy
 * (`landingPage` in GET /config) overrides it field by field, so a field left
 * blank in the editor falls back to this text instead of showing nothing.
 * Section ids mirror the backend's SettingService::LANDING_SECTIONS.
 */

export type LandingSectionId =
  | 'hero'
  | 'banners'
  | 'categories'
  | 'offers'
  | 'nearby'
  | 'customerBenefits'
  | 'howItWorks'
  | 'vendorBenefits'
  | 'personalLink'
  | 'pricing'
  | 'faqs'
  | 'finalCta'

export interface LandingSectionSetting {
  id: LandingSectionId
  enabled: boolean
  /** Heading override; blank = the default heading. */
  title?: string | null
  /** Line under the heading; blank = the default line. */
  subtitle?: string | null
}

export interface LandingItem {
  title: string
  text?: string | null
}

export interface LandingFaq {
  q: string
  a: string
}

export interface LandingHero {
  badge?: string | null
  title?: string | null
  subtitle?: string | null
  customerCta?: string | null
  vendorCta?: string | null
}

/** What the admin saves. Every part is optional. */
export interface LandingContent {
  sections?: LandingSectionSetting[] | null
  hero?: LandingHero | null
  customerBenefits?: LandingItem[] | null
  vendorBenefits?: LandingItem[] | null
  faqs?: LandingFaq[] | null
}

export interface LandingSectionMeta {
  id: LandingSectionId
  label: string
  description: string
  /** Null = the section has no heading of its own (hero, banners). */
  defaultTitle: string | null
  defaultSubtitle: string | null
}

export const LANDING_SECTIONS: LandingSectionMeta[] = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'The headline, and the two sign-up buttons for customers and shops.',
    defaultTitle: null,
    defaultSubtitle: null,
  },
  {
    id: 'banners',
    label: 'Banners',
    description: 'The "Home banners" carousel (top slot).',
    defaultTitle: null,
    defaultSubtitle: null,
  },
  {
    id: 'categories',
    label: 'Shop categories',
    description: 'The categories marked "show on homepage". Each opens a search.',
    defaultTitle: 'Shop by category',
    defaultSubtitle: 'Every kind of local shop, in one place.',
  },
  {
    id: 'offers',
    label: 'Live offers',
    description: 'Discounted items from shops right now.',
    defaultTitle: 'Today’s offers near you',
    defaultSubtitle: 'Real discounts, set by the shops themselves.',
  },
  {
    id: 'nearby',
    label: 'Shops near you',
    description: 'Shops sorted by distance once the visitor shares a location.',
    defaultTitle: 'Shops near you',
    defaultSubtitle: 'See what is open now, how far it is, menus and reviews.',
  },
  {
    id: 'customerBenefits',
    label: 'Benefits for customers',
    description: 'Why customers should use Listee. Edit the cards below.',
    defaultTitle: 'Why customers love Listee',
    defaultSubtitle: 'Save money at the shops you already visit.',
  },
  {
    id: 'howItWorks',
    label: 'How it works',
    description: 'Three steps for customers and three for shop owners.',
    defaultTitle: 'How Listee works',
    defaultSubtitle: 'Simple for customers. Simple for shops.',
  },
  {
    id: 'vendorBenefits',
    label: 'Benefits for shops',
    description: 'Why a shop owner should register. Edit the cards below.',
    defaultTitle: 'Everything your shop needs to grow',
    defaultSubtitle: 'Get found, sell more and bring customers back — from your phone.',
  },
  {
    id: 'personalLink',
    label: 'Personal link',
    description: 'Your own shop link and QR — free for every shop, never expires.',
    defaultTitle: 'Your own shop link — only your shop',
    defaultSubtitle:
      'Customers who open your link or scan your QR see only your shop. No other shops, no competitors.',
  },
  {
    id: 'pricing',
    label: 'Pricing plans',
    description: 'The active plans from Plans, with a sign-up button on each.',
    defaultTitle: 'Simple plans for every shop',
    defaultSubtitle: 'Start small and upgrade when you grow.',
  },
  {
    id: 'faqs',
    label: 'FAQs',
    description: 'Questions and answers. Edit them below.',
    defaultTitle: 'Frequently asked questions',
    defaultSubtitle: null,
  },
  {
    id: 'finalCta',
    label: 'Final sign-up',
    description: 'The closing call to register, for shops and customers.',
    defaultTitle: 'Ready to grow your shop with Listee?',
    defaultSubtitle: 'Register in a few minutes with your mobile number. Customers can start exploring right away.',
  },
]

export const LANDING_META = Object.fromEntries(LANDING_SECTIONS.map((s) => [s.id, s])) as Record<
  LandingSectionId,
  LandingSectionMeta
>

export const DEFAULT_LANDING_SECTIONS: LandingSectionSetting[] = LANDING_SECTIONS.map((s) => ({
  id: s.id,
  enabled: true,
  title: null,
  subtitle: null,
}))

export const DEFAULT_HERO: Required<{ [K in keyof LandingHero]: string }> = {
  badge: 'Local shops · Offers · Rewards',
  title: 'Your neighbourhood shops, their best offers and your rewards — in one place',
  subtitle:
    'Customers find shops nearby, grab today’s discounts and earn rewards on every visit. Shop owners get an online shop, their own link and QR, and simple tools to bring customers back.',
  customerCta: 'Explore shops near me',
  vendorCta: 'Register your shop',
}

export const DEFAULT_CUSTOMER_BENEFITS: LandingItem[] = [
  { title: 'Discounts every day', text: 'Live offers and combos from the shops around you, updated by the owners themselves.' },
  { title: 'Earn coins and rewards', text: 'Collect coins when you order and use them for money off your next visit.' },
  { title: 'Spin and win', text: 'Win surprise offers at shops that run a lucky spin.' },
  { title: 'Order at the shop', text: 'Scan the table QR or order ahead — eat in or pick up, without waiting.' },
  { title: 'Find shops nearby', text: 'See what is open now, how far it is, the menu, photos and reviews.' },
  { title: 'Follow your favourites', text: 'Save the shops you like and hear about their new offers first.' },
]

export const DEFAULT_VENDOR_BENEFITS: LandingItem[] = [
  { title: 'Your shop online in minutes', text: 'Products, prices, photos, timings and location on a page customers can find.' },
  { title: 'Your own link and QR', text: 'Share one link on WhatsApp and Instagram, or print the QR for your counter and tables.' },
  { title: 'Offers, combos and coupons', text: 'Create a discount in seconds and it shows to customers nearby straight away.' },
  { title: 'Bring customers back', text: 'Loyalty rewards, coins and spin-to-win keep your regulars coming.' },
  { title: 'Orders and billing', text: 'Take table and counter orders on your phone, paid online or in cash.' },
  { title: 'Reach your customers', text: 'Send notifications and WhatsApp offers to the people who follow your shop.' },
  { title: 'Know what works', text: 'See visits, orders, reviews and which offers bring people in.' },
  { title: 'Reviews that build trust', text: 'Collect reviews with your own review link and show them on your page.' },
]

export const DEFAULT_FAQS: LandingFaq[] = [
  {
    q: 'What is Listee?',
    a: 'Listee puts your neighbourhood shops online with their offers and rewards. Customers find shops near them and save money; shop owners get more visits and repeat customers.',
  },
  {
    q: 'Is Listee free for customers?',
    a: 'Yes. Browsing shops, using offers and earning rewards costs customers nothing.',
  },
  {
    q: 'How do I register my shop?',
    a: 'Tap “Register your shop”, sign up with your mobile number and a PIN, then add your shop’s name, category, address and products. The Listee team checks new shops before they go live.',
  },
  {
    q: 'What is a personal link?',
    a: 'It is your shop’s own web link and QR code. Anyone who opens it sees only your shop — your products, offers and reviews — with no other shops around it. You can start with a free trial.',
  },
  {
    q: 'How much does it cost for a shop?',
    a: 'Pick the plan that fits your shop from the plans on this page. You can start on a lower plan and upgrade any time from your shop dashboard.',
  },
  {
    q: 'Does Listee deliver?',
    a: 'Most shops on Listee are for eating in and picking up. Shops that offer home delivery show it on their page.',
  },
  {
    q: 'How do coins and rewards work?',
    a: 'Customers earn coins on their orders and can use them for money off later. Shops can also give their own rewards, such as a discount on the next visit or a prize from a lucky spin.',
  },
  {
    q: 'Can I change my offers and prices myself?',
    a: 'Yes. Everything about your shop — products, prices, offers, timings and photos — is edited by you from your phone, and changes show straight away.',
  },
]

export interface ResolvedLanding {
  sections: LandingSectionSetting[]
  hero: typeof DEFAULT_HERO
  customerBenefits: LandingItem[]
  vendorBenefits: LandingItem[]
  faqs: LandingFaq[]
}

const KNOWN = new Set<string>(LANDING_SECTIONS.map((s) => s.id))

/**
 * The saved section order with any section it does not mention added at its
 * default place, so a section added later never silently disappears (the same
 * rule as the customer home layout).
 */
export function resolveSections(saved: LandingSectionSetting[] | null | undefined): LandingSectionSetting[] {
  const list = (saved ?? []).filter((s) => KNOWN.has(s.id))
  if (list.length === 0) return DEFAULT_LANDING_SECTIONS.map((s) => ({ ...s }))

  const seen = new Set(list.map((s) => s.id))
  const out = list.map((s) => ({ ...s }))
  DEFAULT_LANDING_SECTIONS.forEach((def, i) => {
    if (seen.has(def.id)) return
    out.splice(Math.min(i, out.length), 0, { ...def })
  })
  return out
}

const filled = (v: string | null | undefined): v is string => typeof v === 'string' && v.trim() !== ''

/** Saved content over the built-in content. Empty lists fall back to the defaults. */
export function resolveLanding(saved: LandingContent | null | undefined): ResolvedLanding {
  const hero = { ...DEFAULT_HERO }
  for (const key of Object.keys(DEFAULT_HERO) as (keyof LandingHero)[]) {
    const value = saved?.hero?.[key]
    if (filled(value)) hero[key] = value.trim()
  }

  const items = (list: LandingItem[] | null | undefined, fallback: LandingItem[]) => {
    const clean = (list ?? []).filter((i) => filled(i.title))
    return clean.length ? clean : fallback
  }
  const faqs = (saved?.faqs ?? []).filter((f) => filled(f.q) && filled(f.a))

  return {
    sections: resolveSections(saved?.sections),
    hero,
    customerBenefits: items(saved?.customerBenefits, DEFAULT_CUSTOMER_BENEFITS),
    vendorBenefits: items(saved?.vendorBenefits, DEFAULT_VENDOR_BENEFITS),
    faqs: faqs.length ? faqs : DEFAULT_FAQS,
  }
}

/** A section's heading and line: the admin's, else the default. */
export function sectionText(section: LandingSectionSetting): { title: string; subtitle: string | null } {
  const meta = LANDING_META[section.id]
  return {
    title: filled(section.title) ? section.title.trim() : (meta.defaultTitle ?? ''),
    subtitle: filled(section.subtitle) ? section.subtitle.trim() : meta.defaultSubtitle,
  }
}
