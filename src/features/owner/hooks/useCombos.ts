/**
 * TanStack Query hooks for the combo builder (Phase 7.3).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { comboService } from '../services/comboService'
import type { Combo, ComboFormValues } from '../comboTypes'

export const comboKeys = {
  all: ['owner', 'combos'] as const,
}

export function useCombos() {
  return useQuery<Combo[]>({
    queryKey: comboKeys.all,
    queryFn: () => comboService.list(),
  })
}

export function useComboActions() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: comboKeys.all })

  return {
    create: useMutation({
      mutationFn: (values: ComboFormValues) => comboService.create(values),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; values: Partial<ComboFormValues> }) =>
        comboService.update(v.id, v.values),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => comboService.remove(id),
      onSuccess: done,
    }),
  }
}
