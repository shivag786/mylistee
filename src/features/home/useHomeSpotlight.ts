import { useQuery } from '@tanstack/react-query'
import { useFeedLocation } from '@/features/location/useFeedLocation'
import { homeService, type HomeSpotlight } from './homeService'

/** Hero dishes + shop stories, ranked for this viewer (followed → nearby). */
export function useHomeSpotlight() {
  const { lat, lng, viewer } = useFeedLocation()
  return useQuery<HomeSpotlight>({
    queryKey: ['home', 'spotlight', { lat, lng, viewer }],
    queryFn: () => homeService.spotlight({ lat, lng }),
    staleTime: 60_000,
  })
}
