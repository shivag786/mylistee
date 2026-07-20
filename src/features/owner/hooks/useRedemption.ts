import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { redemptionService } from '../services/redemptionService'
import { ownerKeys } from './useOwner'

export const redemptionKeys = {
  history: ['owner', 'redemptions'] as const,
}

export function useRedemptionHistory() {
  return useQuery({
    queryKey: redemptionKeys.history,
    queryFn: () => redemptionService.history(),
  })
}

export function useVerifyReward() {
  return useMutation({ mutationFn: (code: string) => redemptionService.verify(code) })
}

export function useRedeemReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => redemptionService.redeem(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: redemptionKeys.history })
      void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
    },
  })
}
