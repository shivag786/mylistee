/** Reward redemption API for the business owner (document/phase/11 §Redemption). */
import { apiClient } from '@/services/apiClient'

export interface RedemptionReward {
  id: string
  code: string
  title: string
  rewardValue: string | null
  status: 'active' | 'redeemed' | 'expired'
  customerName: string | null
  wonAt: string | null
  expiresAt: string | null
  redeemedAt: string | null
}

export const redemptionService = {
  /** Preview a code before redeeming (throws ApiError with reason if invalid). */
  async verify(code: string): Promise<RedemptionReward> {
    return apiClient.post<RedemptionReward>('business/redeem/verify', { code })
  },

  /** Mark a reward redeemed. */
  async redeem(code: string): Promise<RedemptionReward> {
    return apiClient.post<RedemptionReward>('business/redeem', { code })
  },

  async history(): Promise<RedemptionReward[]> {
    return apiClient.get<RedemptionReward[]>('business/redemptions')
  },
}
