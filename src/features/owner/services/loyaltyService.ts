/**
 * Owner loyalty (Listee Coins) API — earn-rate config + reward tiers (Phase 2).
 * All calls go through the shared apiClient (service-layer rule).
 */
import { apiClient } from '@/services/apiClient'

export interface LoyaltyProgram {
  enabled: boolean
  coinsPerSpin: number
  coinsPerFirstScan: number
  coinsPerCheckin: number
  coinsPerReview: number
  coinsPerRedeem: number
  monthlyBudgetCap: number
  coinsMintedThisMonth: number
}

export interface LoyaltyReward {
  id: string
  title: string
  description: string | null
  coinsCost: number
  rewardValue: string | null
  active: boolean
  stock: number | null
  sortOrder: number
  available: boolean
}

export interface LoyaltyState {
  program: LoyaltyProgram
  rewards: LoyaltyReward[]
}

/** Editable earn-rate fields (what the config form sends). */
export type LoyaltyProgramInput = {
  enabled: boolean
  coinsPerSpin?: number | null
  coinsPerFirstScan?: number | null
  coinsPerCheckin?: number | null
  coinsPerReview?: number | null
  coinsPerRedeem?: number | null
  monthlyBudgetCap?: number | null
}

export type LoyaltyRewardInput = {
  title: string
  description?: string | null
  coinsCost: number
  rewardValue?: string | null
  active?: boolean
  stock?: number | null
  sortOrder?: number
}

export const loyaltyService = {
  async get(): Promise<LoyaltyState> {
    return apiClient.get<LoyaltyState>('business/loyalty')
  },

  async updateProgram(input: LoyaltyProgramInput): Promise<LoyaltyProgram> {
    return apiClient.put<LoyaltyProgram>('business/loyalty', input)
  },

  async createReward(input: LoyaltyRewardInput): Promise<LoyaltyReward> {
    return apiClient.post<LoyaltyReward>('business/loyalty/rewards', input)
  },

  async updateReward(id: string, input: LoyaltyRewardInput): Promise<LoyaltyReward> {
    return apiClient.put<LoyaltyReward>(`business/loyalty/rewards/${id}`, input)
  },

  async deleteReward(id: string): Promise<void> {
    await apiClient.delete(`business/loyalty/rewards/${id}`)
  },
}
