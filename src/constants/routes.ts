/**
 * Central route registry. Never scatter route strings across the app
 * (document/phase/04 §Routing). Grouped by audience.
 */
export const ROUTES = {
  // Public / customer
  home: '/',
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

  // Business owner
  owner: {
    root: '/business',
    register: '/business/register',
    dashboard: '/business/dashboard',
    orders: '/business/orders',
    products: '/business/products',
    tables: '/business/tables',
    combos: '/business/combos',
    growSales: '/business/grow-sales',
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
    subscription: '/business/subscription',
    personalLink: '/business/personal-link',
    settings: '/business/settings',
  },

  // Admin (Super Admin panel — Milestone 14)
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    businesses: '/admin/businesses',
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
    broadcast: '/admin/broadcast',
    banners: '/admin/banners',
    homeLayout: '/admin/home-layout',
    featureFlags: '/admin/feature-flags',
    ownerMenu: '/admin/owner-menu',
    settings: '/admin/settings',
    cms: '/admin/cms',
    fraud: '/admin/fraud',
    auditLogs: '/admin/audit-logs',
    reports: '/admin/reports',
  },

  notFound: '*',
} as const
