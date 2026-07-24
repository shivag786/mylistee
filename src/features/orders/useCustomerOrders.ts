import { useQuery } from '@tanstack/react-query'
import { customerOrderService } from './customerOrderService'
import type { Order } from '@/features/owner/orderTypes'

/** The signed-in customer's own orders (newest first is applied in the page). */
export function useCustomerOrders() {
  return useQuery<Order[]>({
    queryKey: ['customer', 'orders'],
    queryFn: () => customerOrderService.list(),
  })
}
