import { useNavigate } from 'react-router-dom'
import { Gift, BadgeCheck, Sparkles, Tag, Bell, X, type LucideIcon } from 'lucide-react'
import { formatRelative } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useMarkRead, useDeleteNotification } from '../hooks/useNotifications'
import type { AppNotification, NotificationType } from '../services/notificationService'

const ICONS: Record<NotificationType, LucideIcon> = {
  reward_won: Gift,
  reward_redeemed: BadgeCheck,
  spin_activity: Sparkles,
  offer_expiring: Tag,
  system: Bell,
}

export function NotificationItem({ notification }: { notification: AppNotification }) {
  const navigate = useNavigate()
  const markRead = useMarkRead()
  const remove = useDeleteNotification()
  const Icon = ICONS[notification.type] ?? Bell

  function open() {
    if (!notification.isRead) markRead.mutate(notification.id)
    if (notification.link) navigate(notification.link)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-border/60 p-4 transition-colors',
        notification.isRead ? 'bg-surface' : 'bg-primary-soft/40',
      )}
    >
      <button type="button" onClick={open} className="flex flex-1 items-start gap-3 text-left">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full',
            notification.isRead ? 'bg-surface-muted text-text-secondary' : 'bg-primary text-primary-foreground',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">{notification.title}</p>
          {notification.body && <p className="text-caption text-text-secondary">{notification.body}</p>}
          {notification.createdAt && (
            <p className="mt-0.5 text-small text-text-muted">{formatRelative(notification.createdAt)}</p>
          )}
        </div>
      </button>
      {!notification.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
      <button
        type="button"
        aria-label="Delete notification"
        onClick={() => remove.mutate(notification.id)}
        className="shrink-0 rounded-full p-1 text-text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
