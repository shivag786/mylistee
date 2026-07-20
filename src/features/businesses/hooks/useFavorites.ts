import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoriteService } from '../services/favoriteService'

export const favoriteKeys = {
  list: ['favorites'] as const,
}

export function useFavorites() {
  return useQuery({ queryKey: favoriteKeys.list, queryFn: () => favoriteService.list() })
}

/** Toggle a favorite; refreshes favorites + any business listings. */
export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, next }: { slug: string; next: boolean }) =>
      next ? favoriteService.add(slug) : favoriteService.remove(slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: favoriteKeys.list })
      void qc.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}
