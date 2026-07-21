/**
 * TanStack Query hooks for the owner loyalty config (Phase 2).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  loyaltyService,
  type LoyaltyProgramInput,
  type LoyaltyRewardInput,
  type LoyaltyState,
} from '../services/loyaltyService'

const loyaltyKey = ['owner', 'loyalty'] as const

export function useLoyalty() {
  return useQuery<LoyaltyState>({
    queryKey: loyaltyKey,
    queryFn: () => loyaltyService.get(),
  })
}

export function useUpdateLoyaltyProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoyaltyProgramInput) => loyaltyService.updateProgram(input),
    onSuccess: (program) => {
      qc.setQueryData<LoyaltyState>(loyaltyKey, (prev) =>
        prev ? { ...prev, program } : prev,
      )
    },
  })
}

export function useCreateLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoyaltyRewardInput) => loyaltyService.createReward(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: loyaltyKey }),
  })
}

export function useUpdateLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LoyaltyRewardInput }) =>
      loyaltyService.updateReward(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: loyaltyKey }),
  })
}

export function useDeleteLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => loyaltyService.deleteReward(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: loyaltyKey }),
  })
}
