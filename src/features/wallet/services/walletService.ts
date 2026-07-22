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

export interface WalletToken {
  token: string
  expiresAt: string
  expiresInSeconds: number
}

export const walletService = {
  async getSummary(): Promise<WalletSummary> {
    const { summary } = await apiClient.get<{ summary: WalletSummary }>('wallet')
    return summary
  },

  async getRewards(status?: WalletRewardStatus): Promise<WonReward[]> {
    return apiClient.get<WonReward[]>('wallet/rewards', { query: { status } })
  },

  /** Rotating wallet token shown at the counter (Phase 7.3). */
  async getToken(): Promise<WalletToken> {
    return apiClient.get<WalletToken>('wallet/token')
  },

  async refreshToken(): Promise<WalletToken> {
    return apiClient.post<WalletToken>('wallet/token/refresh')
  },
}
