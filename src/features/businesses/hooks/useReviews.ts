import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewService } from '../services/reviewService'
import { publicBusinessKeys } from './usePublicBusiness'

export const reviewKeys = {
  list: (slug: string) => ['reviews', slug] as const,
}

export function useReviews(slug: string) {
  return useQuery({
    queryKey: reviewKeys.list(slug),
    queryFn: () => reviewService.list(slug),
    enabled: Boolean(slug),
  })
}

export function useSubmitReview(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      reviewService.submit(slug, rating, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.list(slug) })
      void qc.invalidateQueries({ queryKey: publicBusinessKeys.profile(slug) })
    },
  })
}
