/** In-app notifications + FCM device registration (document/phase/11 §Notifications). */
import { apiClient } from '@/services/apiClient'

export type NotificationType =
  | 'reward_won'
  | 'reward_redeemed'
  | 'spin_activity'
  | 'offer_expiring'
  | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string | null
}

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    return apiClient.get<AppNotification[]>('notifications')
  },
  async unreadCount(): Promise<number> {
    const { unread } = await apiClient.get<{ unread: number }>('notifications/unread-count')
    return unread
  },
  async markAllRead(): Promise<void> {
    await apiClient.patch('notifications/read')
  },
  async markRead(id: string): Promise<void> {
    await apiClient.patch('notifications/read', { id })
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`notifications/${id}`)
  },
  async registerDevice(token: string, platform = 'web'): Promise<void> {
    await apiClient.post('notifications/device-token', { token, platform })
  },
  async unregisterDevice(token: string): Promise<void> {
    await apiClient.delete('notifications/device-token', { query: { token } })
  },
}
