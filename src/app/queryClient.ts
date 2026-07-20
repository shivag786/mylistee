import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/types/api'

/**
 * Shared TanStack Query client. Sensible defaults for a mobile PWA on
 * possibly slow networks (document/phase/03 §Performance).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — avoid refetch storms on navigation
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Don't retry auth/validation errors; retry transient ones once.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
