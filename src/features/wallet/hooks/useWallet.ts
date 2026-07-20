import { useQuery } from '@tanstack/react-query'
import { walletService, type WalletRewardStatus } from '../services/walletService'

export const walletKeys = {
  summary: ['wallet', 'summary'] as const,
  rewards: (status: WalletRewardStatus) => ['wallet', 'rewards', status] as const,
}

export function useWalletSummary() {
  return useQuery({ queryKey: walletKeys.summary, queryFn: () => walletService.getSummary() })
}

export function useWalletRewards(status: WalletRewardStatus) {
  return useQuery({
    queryKey: walletKeys.rewards(status),
    queryFn: () => walletService.getRewards(status),
  })
}
