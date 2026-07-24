import { useQuery } from '@tanstack/react-query'
import { configService, type AppConfig } from '../services/configService'

/** Public app config (feature toggles). Cached long — rarely changes. */
export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ['system', 'config'],
    queryFn: () => configService.get(),
    staleTime: 1000 * 60 * 10,
  })
}
