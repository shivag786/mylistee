/** TanStack Query hooks for the owner's "Notify customers" page. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pushService, type PushInput } from '../services/pushService'

const pushKey = ['owner', 'push'] as const

export function usePushSummary() {
  return useQuery({ queryKey: pushKey, queryFn: pushService.summary })
}

export function useSendPush() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PushInput) => pushService.send(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: pushKey }),
  })
}
