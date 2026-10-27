/** TanStack Query hooks for the owner's "Notify customers" page. */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pushService, type PushAudience, type PushInput } from '../services/pushService'

const pushKey = ['owner', 'push'] as const

export function usePushSummary() {
  return useQuery({ queryKey: pushKey, queryFn: pushService.summary })
}

/** The audience as a list, 30 at a time (the next page loads on scroll). */
export function usePushCustomers(audience: PushAudience, search: string) {
  return useInfiniteQuery({
    queryKey: [...pushKey, 'customers', audience, search],
    queryFn: ({ pageParam }) => pushService.customers(audience, search, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
  })
}

export function useSendPush() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PushInput) => pushService.send(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: pushKey }),
  })
}
