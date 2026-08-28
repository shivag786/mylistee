import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/types/api'

/**
 * Shared TanStack Query client.
 *
 * Configured to never serve stale data: repeated reports of out-of-date screens
 * made freshness worth more than the saved requests. Every query refetches on
 * mount, on reconnect and on window focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Nothing is served stale. Every mount/remount refetches, so the screen
      // always reflects the server rather than a snapshot from minutes ago.
      staleTime: 0,
      // Kept briefly so a back-navigation paints instantly instead of flashing
      // a skeleton — the data is still refetched immediately underneath.
      gcTime: 30_000,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry auth/validation errors; retry transient ones once.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 1
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
