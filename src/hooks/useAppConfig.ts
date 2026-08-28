import { useQuery } from '@tanstack/react-query'
import { configService } from '@/services/configService'

/** Public app config — cached; safe to call from multiple places. */
export function useAppConfig() {
  return useQuery({
    queryKey: ['app', 'config'],
    queryFn: () => configService.get(),
  })
}
