import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { usePushRegistration } from '../hooks/usePush'
import { pushPermission } from '../push'

/**
 * On/off switch for push notifications on THIS device — shared by the
 * customer Profile / Alerts pages and the owner Settings page.
 *
 * On asks the browser (first time) and saves the device token; off removes the
 * token so nothing more is pushed here. A browser-level block can only be
 * lifted in browser settings, which the hint then explains.
 */
export function PushToggle({
  title = 'Push notifications',
  hint = 'Get notified on this phone even when Listee is closed.',
  className,
}: {
  title?: string
  hint?: string
  className?: string
}) {
  const { permission, enable, disable, active } = usePushRegistration({ registerEffects: false })
  const [busy, setBusy] = useState(false)

  async function toggle(next: boolean) {
    setBusy(true)
    try {
      if (next) {
        const ok = await enable()
        if (!ok) {
          toast.error(
            pushPermission() === 'denied'
              ? 'Notifications are blocked for this site. Tap the lock icon next to the address → Notifications → Allow, then switch on again.'
              : 'Could not turn on notifications on this device.',
          )
        }
      } else {
        await disable()
        toast.success('Notifications off on this device')
      }
    } finally {
      setBusy(false)
    }
  }

  const text =
    permission === 'unsupported'
      ? 'This browser cannot show notifications. On iPhone, add Listee to your Home Screen and open it from there.'
      : permission === 'denied'
        ? 'Blocked in the browser — tap the lock icon next to the address → Notifications → Allow.'
        : hint

  return (
    <div className={cn('flex items-center gap-3 px-5 py-4', className)}>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          active ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary',
        )}
      >
        <Bell className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-small text-text-secondary">{text}</p>
      </div>
      <Switch
        checked={active}
        onCheckedChange={(v) => void toggle(v)}
        disabled={busy || permission === 'unsupported'}
        aria-label={title}
      />
    </div>
  )
}
