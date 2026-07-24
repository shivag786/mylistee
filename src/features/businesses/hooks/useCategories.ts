import { useQuery } from '@tanstack/react-query'
import { businessService } from '../services/businessService'
import type { BusinessCategory } from '../types'

/** Public business categories — home quick-filter chips. Cached long (rarely change). */
export function usePublicCategories() {
  return useQuery<BusinessCategory[]>({
    queryKey: ['categories', 'public'],
    queryFn: () => businessService.categories(),
    staleTime: 1000 * 60 * 30,
  })
}
