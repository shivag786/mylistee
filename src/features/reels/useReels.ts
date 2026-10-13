import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFeedLocation } from '@/features/location/useFeedLocation'
import { reelService, type NewReel } from './reelService'

const mineKey = ['owner', 'reels'] as const

/** Home "Reels near you". */
export function useReelFeed(limit = 12) {
  const { lat, lng, viewer } = useFeedLocation()
  return useQuery({
    queryKey: ['reels', 'feed', { lat, lng, viewer, limit }],
    queryFn: () => reelService.feed({ lat, lng, limit }),
    staleTime: 60_000,
  })
}

export function useMyReels() {
  return useQuery({ queryKey: mineKey, queryFn: () => reelService.mine() })
}

export function useCreateReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewReel) => reelService.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mineKey }),
  })
}

export function useSetReelVisible() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => reelService.setVisible(id, visible),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mineKey }),
  })
}

export function useDeleteReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reelService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mineKey }),
  })
}
