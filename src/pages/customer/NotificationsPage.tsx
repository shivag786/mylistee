import { Bell, BellRing, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { MESSAGES } from '@/constants/messages'
import { useNotifications, useMarkAllRead } from '@/features/notifications/hooks/useNotifications'
import { usePushRegistration } from '@/features/notifications/hooks/usePush'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'

export function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } = useNotifications()
  const markAll = useMarkAllRead()
  const { permission, enable } = usePushRegistration()

  const hasUnread = notifications?.some((n) => !n.isRead) ?? false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-title font-bold text-foreground">Alerts</h1>
        {hasUnread && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<CheckCheck className="size-4" />}
            isLoading={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Enable push (only when supported and not yet decided) */}
      {permission === 'default' && (
        <Card className="flex items-center gap-3" elevation="soft">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <BellRing className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium text-foreground">Turn on notifications</p>
            <p className="text-caption text-text-secondary">Get alerted the moment you win a reward.</p>
          </div>
          <Button size="sm" onClick={() => void enable()}>
            Enable
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} label="Loading alerts" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-7" />}
          title={MESSAGES.empty.notifications.title}
          description={MESSAGES.empty.notifications.description}
        />
      ) : (
        <Stagger className="space-y-2">
          {notifications.map((notification) => (
            <StaggerItem key={notification.id}>
              <NotificationItem notification={notification} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
