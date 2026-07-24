/** Customer wallet API (document/phase/11 §Wallet Endpoints). */
import { apiClient } from '@/services/apiClient'
import type { WonReward } from '@/features/businesses/publicTypes'

export interface WalletSummary {
  available: number
  redeemed: number
  expired: number
  total: number
}

export type WalletRewardStatus = 'active' | 'redeemed' | 'expired'

export const walletService = {
  async getSummary(): Promise<WalletSummary> {
    const { summary } = await apiClient.get<{ summary: WalletSummary }>('wallet')
    return summary
  },

  async getRewards(status?: WalletRewardStatus): Promise<WonReward[]> {
    return apiClient.get<WonReward[]>('wallet/rewards', { query: { status } })
  },
}
