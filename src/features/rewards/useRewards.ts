import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rewardService } from './rewardService'
import type { CouponFormValues, OwnerRewards } from './types'
import type { PlaceOrderPayload } from '@/features/orders/customerOrderService'

export const rewardKeys = {
  owner: ['owner', 'rewards'] as const,
  quote: (payload: unknown) => ['cart', 'quote', payload] as const,
}

export function useOwnerRewards() {
  return useQuery({ queryKey: rewardKeys.owner, queryFn: rewardService.get })
}

export function useRewardActions() {
  const qc = useQueryClient()
  const refresh = () => void qc.invalidateQueries({ queryKey: rewardKeys.owner })

  return {
    saveRules: useMutation({
      mutationFn: (rules: Pick<OwnerRewards, 'billDiscount' | 'comeback' | 'loyalty'>) => rewardService.saveRules(rules),
      onSuccess: (data) => qc.setQueryData(rewardKeys.owner, data),
    }),
    createCoupon: useMutation({ mutationFn: (v: CouponFormValues) => rewardService.createCoupon(v), onSuccess: refresh }),
    updateCoupon: useMutation({
      mutationFn: (v: { id: string; values: CouponFormValues }) => rewardService.updateCoupon(v.id, v.values),
      onSuccess: refresh,
    }),
    deleteCoupon: useMutation({ mutationFn: (id: string) => rewardService.deleteCoupon(id), onSuccess: refresh }),
  }
}

/**
 * The server's bill for the cart, refetched as items, coupon or service mode
 * change. Keeps the last bill on screen while the next one loads.
 */
export function useCartQuote(
  payload: (Pick<PlaceOrderPayload, 'business' | 'items' | 'serviceType'> & { couponCode?: string }) | null,
) {
  return useQuery({
    queryKey: rewardKeys.quote(payload),
    queryFn: () => rewardService.quote(payload!),
    enabled: payload !== null && payload.items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
