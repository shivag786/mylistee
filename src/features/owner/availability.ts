/** Owner Settings → shop availability: close for a while, reopen, pause orders. */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import { ownerKeys } from './hooks/useOwner'
import type { OwnerBusiness } from './types'

export const availabilityService = {
  close: (hours: number, note?: string) => apiClient.post<OwnerBusiness>('business/close', { hours, note }),
  reopen: () => apiClient.post<OwnerBusiness>('business/reopen'),
  pauseOrders: (paused: boolean) => apiClient.put<OwnerBusiness>('business/orders-paused', { paused }),
}

function useBusinessMutation<A>(fn: (args: A) => Promise<OwnerBusiness>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (business) => qc.setQueryData(ownerKeys.business, business),
  })
}

export const useCloseShop = () =>
  useBusinessMutation(({ hours, note }: { hours: number; note?: string }) => availabilityService.close(hours, note))
export const useReopenShop = () => useBusinessMutation((_: void) => availabilityService.reopen())
export const usePauseOrders = () => useBusinessMutation((paused: boolean) => availabilityService.pauseOrders(paused))

/** "18 Oct, 2:30 PM" — how long a closure lasts, as owners and customers read it. */
export function formatClosedUntil(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}
