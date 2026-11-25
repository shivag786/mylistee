/**
 * Central route registry. Never scatter route strings across the app
 * (document/phase/04 §Routing). Grouped by audience.
 */
export const ROUTES = {
  // Public / customer
  home: '/',
  /** The shop feed. Always here, whether `/` is the feed or the landing page. */
  explore: '/explore',
  /** The landing page, always — for previews and marketing links, whatever `/` shows. */
  landing: '/landing',
  /** The Listee join / marketing home (new design) — see features/marketing. */
  join: '/join',
  nearby: '/nearby',
  deals: '/deals',
  orders: '/orders',
  wallet: '/wallet',
  notifications: '/notifications',
  profile: '/profile',
  favorites: '/favorites',
  search: '/search',
  login: '/login',
  /** Business-owner login (mobile + PIN) — link shared privately with owners. */
  ownerLogin: '/business/login',
  /** Admin login (mobile + PIN) — link shared privately with admins. */
  adminLogin: '/admin/login',
  /** Public business-owner sign-up (mobile + PIN). */
  ownerSignup: '/get-started',
  /** Business profile opened from a QR scan. */
  businessProfile: (slug = ':slug') => `/b/${slug}`,
  /** A shop's public review link — shared by the owner, no sign-in needed. */
  reviewLink: (slug = ':slug') => `/review/${slug}`,

  /**
   * Legal pages. Public and signed-out reachable on purpose — payment providers
   * (and app stores) check these URLs load without an account.
   */
  terms: '/terms',
  privacy: '/privacy',
  refund: '/refund',
  /** Account deletion — the URL Google Play asks for. */
  deleteAccount: '/delete-account',
  /** Any page written in admin CMS pages (About, Contact, FAQs…). */
  page: (slug = ':slug') => `/p/${slug}`,

  // Business owner
  owner: {
    root: '/business',
    register: '/business/register',
    dashboard: '/business/dashboard',
    orders: '/business/orders',
    pos: '/business/pos',
    products: '/business/products',
    tables: '/business/tables',
    combos: '/business/combos',
    growSales: '/business/grow-sales',
    aiAdvisor: '/business/ai-advisor',
    offers: '/business/offers',
    analytics: '/business/analytics',
    reviews: '/business/reviews',
    loyalty: '/business/loyalty',
    rewards: '/business/rewards',
    redeem: '/business/redeem',
    qr: '/business/qr',
    profile: '/business/profile',
    followers: '/business/followers',
    customers: '/business/customers',
    reels: '/business/reels',
    notify: '/business/notify',
    whatsapp: '/business/whatsapp',
    subscription: '/business/subscription',
    personalLink: '/business/personal-link',
    settings: '/business/settings',
  },

  // Admin (Super Admin panel — Milestone 14)
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    businesses: '/admin/businesses',
    /** A4 QR poster for one shop (no sidebar, prints clean). */
    businessPoster: (id: string) => `/admin/businesses/${id}/poster`,
    businessImport: '/admin/business-import',
    categories: '/admin/categories',
    categoryRequests: '/admin/category-requests',
    customers: '/admin/customers',
    offers: '/admin/offers',
    reviews: '/admin/reviews',
    plans: '/admin/plans',
    revenue: '/admin/revenue',
    orders: '/admin/orders',
    payments: '/admin/payments',
    personalLinks: '/admin/personal-links',
    subscriptions: '/admin/subscriptions',
    vendorHealth: '/admin/vendor-health',
    qrScans: '/admin/qr-scans',
    enquiries: '/admin/enquiries',
    broadcast: '/admin/broadcast',
    banners: '/admin/banners',
    homeLayout: '/admin/home-layout',
    landingPage: '/admin/landing-page',
    seo: '/admin/seo',
    featureFlags: '/admin/feature-flags',
    ownerMenu: '/admin/owner-menu',
    settings: '/admin/settings',
    aiUsage: '/admin/ai',
    whatsapp: '/admin/whatsapp',
    cms: '/admin/cms',
    fraud: '/admin/fraud',
    auditLogs: '/admin/audit-logs',
    reports: '/admin/reports',
  },

  notFound: '*',
} as const
