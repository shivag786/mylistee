import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService } from '../services/walletService'

/**
 * The customer's rotating wallet token with a live countdown (Phase 7.3). When
 * the countdown reaches zero we refetch, which mints a fresh token server-side.
 */
export function useWalletToken(enabled = true) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['wallet', 'token'],
    queryFn: () => walletService.getToken(),
    enabled,
    staleTime: 0,
  })

  const [remaining, setRemaining] = useState(0)

  // Reset the local countdown whenever a new token arrives.
  useEffect(() => {
    if (query.data) setRemaining(Math.max(0, Math.floor(query.data.expiresInSeconds)))
  }, [query.data])

  // Tick down every second; refetch (mint a new token) when it expires.
  useEffect(() => {
    if (!enabled || !query.data) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          void qc.invalidateQueries({ queryKey: ['wallet', 'token'] })
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [enabled, query.data, qc])

  const refresh = useMutation({
    mutationFn: () => walletService.refreshToken(),
    onSuccess: (data) => qc.setQueryData(['wallet', 'token'], data),
  })

  return { token: query.data, remaining, isLoading: query.isLoading, refresh }
}

/** Format seconds as mm:ss. */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
