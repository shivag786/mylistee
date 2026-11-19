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
  | 'stats'
  | 'banners'
  | 'vendorTools'
  | 'aiAssistant'
  | 'whyListee'
  | 'cities'
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
    id: 'stats',
    label: 'Live numbers',
    description: 'Shops, cities, customers and orders on Listee — live, shown once they are big enough.',
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
    id: 'vendorTools',
    label: 'Tools for shops',
    description: 'Everything a shop gets, in tabs: get online, sell & bill, bring customers back, run your team, AI.',
    defaultTitle: 'One app to run and grow your shop',
    defaultSubtitle: 'Listee is not just a listing. It is your online shop, billing counter, loyalty program and marketing team — on your phone.',
  },
  {
    id: 'aiAssistant',
    label: 'AI assistant',
    description: 'The AI menu scan and the AI that writes offers, notifications and review replies.',
    defaultTitle: 'Your shop’s own AI assistant',
    defaultSubtitle: 'Snap your menu and it is online in minutes. Ask for offer ideas, posts and replies — in seconds.',
  },
  {
    id: 'whyListee',
    label: 'Why Listee',
    description: 'Listee next to the big delivery apps: no commission, your own customers, your own link.',
    defaultTitle: 'Your customers. Your brand. No commission.',
    defaultSubtitle: 'Delivery apps take a cut of every order and keep your customers. Listee works for you.',
  },
  {
    id: 'cities',
    label: 'Cities & shops',
    description: 'The cities Listee is live in, with the shops of the chosen city.',
    defaultTitle: 'Live in your city',
    defaultSubtitle: 'Real shops, already taking orders and rewarding customers on Listee.',
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
  badge: 'Online shop · Billing · Rewards · AI',
  title: 'Take your shop online and bring customers back — again and again',
  subtitle:
    'Listee gives every local shop its own online menu, link and QR, table and counter orders, GST billing, loyalty rewards and an AI assistant. Customers find you, order and earn rewards. No commission on orders.',
  customerCta: 'Explore shops near me',
  vendorCta: 'Register your shop free',
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
  { title: 'Your shop online in minutes', text: 'Snap a photo of your menu — the AI fills in dishes, prices and sizes. Add photos, timings and location.' },
  { title: 'Your own link and QR', text: 'Share one link on WhatsApp and Instagram, or print the QR for your counter and tables.' },
  { title: 'Offers, combos and coupons', text: 'Create a discount in seconds and it shows to customers nearby straight away.' },
  { title: 'Bring customers back', text: 'Loyalty rewards, coins and spin-to-win keep your regulars coming.' },
  { title: 'Orders and billing', text: 'Take table and counter orders on your phone, paid online or in cash.' },
  { title: 'Reach your customers', text: 'Send notifications and WhatsApp offers to the people who follow your shop.' },
  { title: 'Know what works', text: 'See visits, orders, reviews and which offers bring people in.' },
  { title: 'Reviews that build trust', text: 'Collect reviews with your own review link and show them on your page.' },
]

/**
 * The "Tools for shops" tabs. Built-in copy (not edited from the admin):
 * it describes what the product does, so it changes with the product.
 */
export interface ToolGroup {
  id: string
  tab: string
  title: string
  text: string
  features: { title: string; text: string }[]
}

export const VENDOR_TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'online',
    tab: 'Get online',
    title: 'Your shop on the internet — ready today',
    text: 'A beautiful shop page with your menu, photos, timings and reviews that customers nearby can find.',
    features: [
      { title: 'AI menu scan', text: 'Photo of your menu → every dish, price and size filled in.' },
      { title: 'Own link and QR', text: 'Free forever. Only your shop — no competitors next to you.' },
      { title: 'Photos, reels and reviews', text: 'Show your best dishes and build trust with real reviews.' },
      { title: 'Found nearby', text: 'Customers in your city see you, your offers and how far you are.' },
    ],
  },
  {
    id: 'sell',
    tab: 'Sell & bill',
    title: 'Take orders and bill in seconds',
    text: 'Orders from the table QR, the counter and online — all in one place, with printed bills.',
    features: [
      { title: 'Table QR ordering', text: 'Customers scan, order and pay from their table.' },
      { title: 'Counter billing (POS)', text: 'Fast billing on your phone with a Bluetooth printer.' },
      { title: 'GST tax invoices', text: 'Proper GST bills for customers, and your day’s report.' },
      { title: 'Online or cash', text: 'UPI and card payments online, or cash at the counter.' },
    ],
  },
  {
    id: 'grow',
    tab: 'Bring customers back',
    title: 'Turn first-time visitors into regulars',
    text: 'Rewards that customers love and that make them choose your shop again.',
    features: [
      { title: 'Loyalty coins', text: 'Customers earn on every order and spend at your shop.' },
      { title: 'Spin & win', text: 'A lucky spin with prizes you choose — fun at every visit.' },
      { title: 'Offers, combos, happy hours', text: 'Create a deal in seconds; it shows to customers nearby.' },
      { title: 'Notifications & WhatsApp', text: 'Tell your followers about new dishes and offers.' },
    ],
  },
  {
    id: 'team',
    tab: 'Run your team',
    title: 'Manage the shop even when you are away',
    text: 'Give each staff member their own login and see everything from your phone.',
    features: [
      { title: 'Staff roles', text: 'Waiter, cashier, kitchen — each sees only what they need.' },
      { title: 'Attendance with selfie', text: 'Staff punch in and out from the app.' },
      { title: 'Kitchen display', text: 'New orders go straight to the kitchen screen.' },
      { title: 'Day close & alerts', text: 'Cash count, sales report and order alerts every day.' },
    ],
  },
  {
    id: 'ai',
    tab: 'AI assistant',
    title: 'An assistant that writes and thinks for you',
    text: 'Built into the Listee Business app — no extra app, no extra cost to try.',
    features: [
      { title: 'Menu from a photo', text: 'Printed menu, PDF or screenshots → your online menu.' },
      { title: 'Dish descriptions', text: 'Tasty, short descriptions for every item.' },
      { title: 'Offer & combo ideas', text: 'Ideas made from your own best sellers.' },
      { title: 'Posts & review replies', text: 'Notification text and polite replies in one tap.' },
    ],
  },
]

/** Listee next to a typical food-delivery app (the "Why Listee" table). */
export const WHY_ROWS: { label: string; listee: string; others: string }[] = [
  { label: 'Commission on each order', listee: '0%', others: 'Often 15–30%' },
  { label: 'Customer details', listee: 'Yours — follow, notify, reward', others: 'Kept by the app' },
  { label: 'Your own link & QR', listee: 'Free, only your shop', others: 'Shown next to competitors' },
  { label: 'Dine-in & counter billing', listee: 'Built in (POS, GST bills)', others: 'Not included' },
  { label: 'Loyalty & spin rewards', listee: 'Built in', others: 'Paid ads instead' },
  { label: 'Getting started', listee: 'Minutes — snap your menu', others: 'Days of paperwork' },
]

export const DEFAULT_FAQS: LandingFaq[] = [
  {
    q: 'Does Listee take a commission on my orders?',
    a: 'No. Listee does not take a commission on your orders. You pay a simple plan, and online payments carry only the payment gateway’s small fee.',
  },
  {
    q: 'How does the AI menu scan work?',
    a: 'In the Listee Business app, tap Add → Scan menu with AI and take a photo of your printed menu (or upload photos, screenshots or a PDF). The AI reads the dishes, sections, prices and sizes. You check and edit the list, then tap Add — your menu is online.',
  },
  {
    q: 'What else can the AI assistant do?',
    a: 'It writes dish descriptions, offer and combo ideas from your best sellers, notification messages for your followers, sales tips and polite replies to reviews. You pick what you like — nothing is posted on its own.',
  },
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
