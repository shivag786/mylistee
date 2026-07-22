/**
 * TanStack Query hooks for customer Listee Coins (Phase 2).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  coinsService,
  type BusinessLoyalty,
  type CoinSummary,
  type CoinTransaction,
} from '../services/coinsService'

export const coinKeys = {
  summary: ['wallet', 'coins'] as const,
  transactions: ['wallet', 'coins', 'transactions'] as const,
  business: (slug: string) => ['businesses', slug, 'loyalty'] as const,
}

export function useCoinSummary(enabled = true) {
  return useQuery<CoinSummary>({
    queryKey: coinKeys.summary,
    queryFn: () => coinsService.summary(),
    enabled,
  })
}

export function useCoinTransactions() {
  return useQuery<CoinTransaction[]>({
    queryKey: coinKeys.transactions,
    queryFn: () => coinsService.transactions(),
  })
}

export function useBusinessLoyalty(slug: string, enabled = true) {
  return useQuery<BusinessLoyalty>({
    queryKey: coinKeys.business(slug),
    queryFn: () => coinsService.businessLoyalty(slug),
    enabled: enabled && slug.length > 0,
  })
}

export function useRedeemTier(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) => coinsService.redeem(rewardId),
    onSuccess: () => {
      // Refresh the whole wallet (balance, coins, history, rewards) + this shop.
      void qc.invalidateQueries({ queryKey: ['wallet'] })
      void qc.invalidateQueries({ queryKey: coinKeys.business(slug) })
    },
  })
}
