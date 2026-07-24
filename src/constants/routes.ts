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

  // Business owner
  owner: {
    root: '/business',
    register: '/business/register',
    dashboard: '/business/dashboard',
    orders: '/business/orders',
    products: '/business/products',
    combos: '/business/combos',
    growSales: '/business/grow-sales',
    offers: '/business/offers',
    analytics: '/business/analytics',
    reviews: '/business/reviews',
    loyalty: '/business/loyalty',
    redeem: '/business/redeem',
    qr: '/business/qr',
    profile: '/business/profile',
    customers: '/business/customers',
    subscription: '/business/subscription',
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
    broadcast: '/admin/broadcast',
    featureFlags: '/admin/feature-flags',
    settings: '/admin/settings',
    cms: '/admin/cms',
    fraud: '/admin/fraud',
    auditLogs: '/admin/audit-logs',
    reports: '/admin/reports',
  },

  notFound: '*',
} as const
