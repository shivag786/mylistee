/**
 * TanStack Query key factory. Centralizing keys keeps cache invalidation
 * predictable and avoids typo-driven cache misses.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  businesses: {
    all: ['businesses'] as const,
    nearby: (params?: Record<string, unknown>) => ['businesses', 'nearby', params ?? {}] as const,
    recommended: ['businesses', 'recommended'] as const,
    new: ['businesses', 'new'] as const,
    detail: (slug: string) => ['businesses', 'detail', slug] as const,
  },
  wallet: {
    root: ['wallet'] as const,
    rewards: ['wallet', 'rewards'] as const,
  },
  offers: {
    byBusiness: (businessId: string) => ['offers', 'business', businessId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
} as const
