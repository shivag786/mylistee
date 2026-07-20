import { useQuery } from '@tanstack/react-query'
import { healthService } from '../services/healthService'

/** Polls the API health endpoint so the UI can reflect backend connectivity. */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => healthService.check(),
    staleTime: 30_000,
    retry: 0,
  })
}
