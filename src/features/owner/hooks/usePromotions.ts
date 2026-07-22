/**
 * TanStack Query hooks for the promotion engine (Phase 7.2b). Mutations
 * invalidate promotions + products (effective price depends on promotions).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { promotionService } from '../services/promotionService'
import { productKeys } from './useProducts'
import type { Promotion, PromotionFormValues } from '../promotionTypes'

export const promotionKeys = {
  all: ['owner', 'promotions'] as const,
  list: (params?: { product?: string; status?: string }) =>
    ['owner', 'promotions', params ?? {}] as const,
}

export function usePromotions(params?: { product?: string; status?: string }) {
  return useQuery<Promotion[]>({
    queryKey: promotionKeys.list(params),
    queryFn: () => promotionService.list(params),
  })
}

export function usePromotionActions() {
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: promotionKeys.all })
    void qc.invalidateQueries({ queryKey: productKeys.products })
  }

  return {
    create: useMutation({
      mutationFn: (values: PromotionFormValues) => promotionService.create(values),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; values: Partial<PromotionFormValues> }) =>
        promotionService.update(v.id, v.values),
      onSuccess: done,
    }),
    setStatus: useMutation({
      mutationFn: (v: { id: string; action: 'pause' | 'resume' }) =>
        promotionService.setStatus(v.id, v.action),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => promotionService.remove(id),
      onSuccess: done,
    }),
  }
}
