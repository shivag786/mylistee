/**
 * Customer Listee Coins API — balance, history, business reward tiers, and
 * spending coins (Phase 2). All calls go through the shared apiClient.
 */
import { apiClient } from '@/services/apiClient'
import type { WonReward } from '@/features/businesses/publicTypes'

export interface CoinBusinessBalance {
  businessId: string
  businessName: string
  slug: string
  logoUrl: string | null
  balance: number
}

export interface CoinSummary {
  total: number
  businesses: CoinBusinessBalance[]
}

export interface CoinTransaction {
  id: string
  type: 'earn' | 'spend' | 'adjust' | 'expire'
  source: string
  amount: number
  balanceAfter: number
  description: string
  businessName: string | null
  createdAt: string | null
}

export interface LoyaltyTier {
  id: string
  title: string
  description: string | null
  coinsCost: number
  rewardValue: string | null
  active: boolean
  stock: number | null
  available: boolean
}

export interface BusinessLoyalty {
  enabled: boolean
  rewards: LoyaltyTier[]
  coinBalance: number
  businessBalance: number
}

export interface RedeemResult {
  reward: WonReward
  coinBalance: number
}

export const coinsService = {
  async summary(): Promise<CoinSummary> {
    return apiClient.get<CoinSummary>('wallet/coins')
  },

  async transactions(): Promise<CoinTransaction[]> {
    return apiClient.get<CoinTransaction[]>('wallet/coins/transactions')
  },

  async businessLoyalty(slug: string): Promise<BusinessLoyalty> {
    return apiClient.get<BusinessLoyalty>(`businesses/${slug}/loyalty`)
  },

  async redeem(rewardId: string): Promise<RedeemResult> {
    return apiClient.post<RedeemResult>('loyalty/redeem', { rewardId })
  },
}
