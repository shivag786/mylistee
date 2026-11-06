/**
 * Personal link — store mode, free for every shop and never expiring. The owner
 * only switches it on or off (PersonalLinkService on the backend).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import { ownerKeys } from './hooks/useOwner'

export interface PersonalLinkState {
  enabled: boolean
  /** Switched on — customers who open the link see only this shop. */
  active: boolean
}

const KEY = ['owner', 'personal-link'] as const

export const personalLinkService = {
  get: () => apiClient.get<PersonalLinkState>('business/personal-link'),
  setEnabled: (enabled: boolean) => apiClient.put<PersonalLinkState>('business/personal-link', { enabled }),
}

export function usePersonalLink() {
  return useQuery({ queryKey: KEY, queryFn: personalLinkService.get })
}

export function useTogglePersonalLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: personalLinkService.setEnabled,
    onSuccess: (state) => {
      qc.setQueryData(KEY, state)
      // storeMode on the business profile follows the link.
      void qc.invalidateQueries({ queryKey: ownerKeys.business })
    },
  })
}
