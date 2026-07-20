import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { publicBusinessService } from '../services/publicBusinessService'
import type { PublicBusinessResponse, SpinResult } from '../publicTypes'

export const publicBusinessKeys = {
  profile: (slug: string) => ['public-business', slug] as const,
}

export function usePublicBusiness(slug: string) {
  return useQuery<PublicBusinessResponse>({
    queryKey: publicBusinessKeys.profile(slug),
    queryFn: () => publicBusinessService.getProfile(slug),
    enabled: Boolean(slug),
  })
}

/** Spin the wheel. On success the profile (spin state) and wallet are refreshed. */
export function useSpin(slug: string) {
  const qc = useQueryClient()
  return useMutation<SpinResult>({
    mutationFn: () => publicBusinessService.spin(slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: publicBusinessKeys.profile(slug) })
      void qc.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
