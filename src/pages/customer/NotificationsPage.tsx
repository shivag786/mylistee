import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { MESSAGES } from '@/constants/messages'
import { useNotifications, useMarkAllRead } from '@/features/notifications/hooks/useNotifications'
import { usePushRegistration } from '@/features/notifications/hooks/usePush'
import { PushToggle } from '@/features/notifications/components/PushToggle'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'

export function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } = useNotifications()
  const markAll = useMarkAllRead()
  // Effects (silent register + foreground messages) run app-wide in PushRegistrar;
  // here we only need the permission state + the enable action for the toggle.
  const { permission } = usePushRegistration({ registerEffects: false })

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

      {/* Push on/off for this device (hidden where the browser cannot push). */}
      {permission !== 'unsupported' && (
        <Card padding="none" elevation="soft">
          <PushToggle hint="Get alerted the moment you win a reward or your order is ready." />
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
