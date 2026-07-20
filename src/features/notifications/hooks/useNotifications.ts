import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { notificationService } from '../services/notificationService'

export const notificationKeys = {
  list: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationService.list(),
  })
}

/** Unread badge counter — polls periodically while signed in. */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationService.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: notificationKeys.list })
  void qc.invalidateQueries({ queryKey: notificationKeys.unread })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => invalidate(qc),
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: () => invalidate(qc),
  })
}
