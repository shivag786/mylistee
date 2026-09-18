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
    // City is part of the key: the same row is a different list in a different
    // city, and without it a cached Mumbai row would be served in Pune.
    recommended: (city?: string | null) => ['businesses', 'recommended', city ?? null] as const,
    new: (city?: string | null) => ['businesses', 'new', city ?? null] as const,
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
