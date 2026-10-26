import { useQuery } from '@tanstack/react-query'
import { customerOrderService } from './customerOrderService'
import type { Order } from '@/features/owner/orderTypes'

/** Statuses the shop can still move on, so the page should keep up with them. */
const LIVE_STATUSES = new Set(['placed', 'confirmed', 'paid'])

/** How often an open order is re-checked while the page is visible. */
const LIVE_POLL_MS = 10_000

/**
 * The signed-in customer's own orders (newest first is applied in the page).
 * While one is still in progress it re-checks every 10s, so "Accepted" or
 * "Completed" shows up without a refresh; with none open it never polls. The
 * poll pauses while the tab is hidden, and a push for the order refreshes it
 * at once (usePushRegistration).
 */
export function useCustomerOrders() {
  return useQuery<Order[]>({
    queryKey: ['customer', 'orders'],
    queryFn: () => customerOrderService.list(),
    refetchInterval: (query) =>
      query.state.data?.some((o) => LIVE_STATUSES.has(o.status)) ? LIVE_POLL_MS : false,
  })
}
