/**
 * Owner order-queue hooks (Phase 7.5). The active list polls every 5s so new
 * orders appear without a manual refresh (near-real-time; upgrade to websockets
 * later without changing callers).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ownerOrderService } from '../services/orderService'
import type { Order, OrderStatusKey } from '../orderTypes'

export const orderKeys = {
  list: (status: string) => ['owner', 'orders', status] as const,
}

export function useOwnerOrders(status = 'active') {
  return useQuery<Order[]>({
    queryKey: orderKeys.list(status),
    queryFn: () => ownerOrderService.list(status === 'active' ? undefined : { status }),
    refetchInterval: status === 'active' ? 5000 : false,
    refetchIntervalInBackground: true,
  })
}

export function useOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; status: Exclude<OrderStatusKey, 'placed'> }) =>
      ownerOrderService.setStatus(v.id, v.status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner', 'orders'] })
    },
  })
}
