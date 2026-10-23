/**
 * Rewards & coupons API. Service-layer rule: UI never calls the API directly.
 */
import { apiClient } from '@/services/apiClient'
import type { CartQuote, CouponFormValues, OwnerCoupon, OwnerRewards, RepeatCustomers, ScratchCard } from './types'
import type { PlaceOrderPayload } from '@/features/orders/customerOrderService'

type RulesPayload = Pick<OwnerRewards, 'billDiscount' | 'comeback' | 'loyalty'>

export const rewardService = {
  /** The owner's setup (rules, codes, stats, Listee's fee). */
  get: (): Promise<OwnerRewards> => apiClient.get<OwnerRewards>('business/rewards'),

  /** Save all three rules at once; null switches one off. */
  saveRules: (rules: RulesPayload): Promise<OwnerRewards> =>
    apiClient.put<OwnerRewards>('business/rewards', {
      bill_discount: rules.billDiscount,
      comeback: rules.comeback,
      loyalty: rules.loyalty,
    }),

  createCoupon: (values: CouponFormValues): Promise<OwnerCoupon> =>
    apiClient.post<OwnerCoupon>('business/coupons', values),

  updateCoupon: (id: string, values: CouponFormValues): Promise<OwnerCoupon> =>
    apiClient.put<OwnerCoupon>(`business/coupons/${id}`, values),

  deleteCoupon: (id: string): Promise<void> => apiClient.delete(`business/coupons/${id}`).then(() => undefined),

  /** Who comes back to the shop, and how far along the loyalty card they are. */
  repeatCustomers: (): Promise<RepeatCustomers> => apiClient.get<RepeatCustomers>('business/rewards/customers'),

  /** The customer's loyalty rewards, as scratch cards. */
  cards: (): Promise<ScratchCard[]> => apiClient.get<ScratchCard[]>('rewards/cards'),

  /** Scratch a card open — the server reveals its reward and code. */
  reveal: (id: string): Promise<ScratchCard> => apiClient.post<ScratchCard>(`rewards/cards/${id}/reveal`),

  /** Price a cart exactly as the order will be — works for guests too. */
  quote: (payload: Pick<PlaceOrderPayload, 'business' | 'items' | 'serviceType'> & { couponCode?: string }): Promise<CartQuote> =>
    apiClient.post<CartQuote>('orders/quote', payload),
}
