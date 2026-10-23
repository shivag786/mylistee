import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushRegistration } from '@/features/notifications/hooks/usePush'
import { pushPermission } from '@/features/notifications/push'
import { storage } from '@/utils/storage'
import { toast } from '@/utils/toast'

/** "Not now" hides the banner for this long. */
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000
const SNOOZE_KEY = 'listee.orderAlertsSnoozedUntil'

function snoozed(): boolean {
  return Number(storage.get(SNOOZE_KEY) ?? 0) > Date.now()
}

/**
 * Asks a shop owner to switch on new-order alerts on this phone, where they
 * work (orders queue, dashboard) rather than only deep in Settings. Gone once
 * alerts are on, and snoozable.
 */
export function OrderAlertsBanner() {
  const reduce = useReducedMotion()
  const { permission, enable, active } = usePushRegistration({ registerEffects: false })
  const [hidden, setHidden] = useState(snoozed)
  const [busy, setBusy] = useState(false)

  const show = !active && !hidden

  async function turnOn() {
    setBusy(true)
    try {
      if (!(await enable())) {
        toast.error(
          pushPermission() === 'denied'
            ? 'Notifications are blocked for this site. Tap the lock icon next to the address → Notifications → Allow.'
            : 'Could not turn on alerts on this device.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  function snooze() {
    storage.set(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
    setHidden(true)
  }

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="relative flex items-start gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-hover p-4 text-primary-foreground shadow-premium">
            <motion.span
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20"
              animate={reduce ? undefined : { rotate: [0, -14, 12, -8, 6, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5 }}
            >
              <BellRing className="size-6" aria-hidden />
            </motion.span>
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-body font-bold">Never miss an order</p>
              <p className="text-small opacity-90">
                {permission === 'unsupported'
                  ? 'This browser can’t show alerts. On iPhone, add Listee to your Home Screen and open it from there.'
                  : permission === 'denied'
                    ? 'Alerts are blocked. Tap the lock icon next to the address → Notifications → Allow, then tap below.'
                    : 'Get a notification on this phone for every new order — even when the app is closed.'}
              </p>
              {permission !== 'unsupported' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2.5"
                  isLoading={busy}
                  onClick={() => void turnOn()}
                >
                  Turn on order alerts
                </Button>
              )}
            </div>
            <button
              type="button"
              onClick={snooze}
              aria-label="Not now"
              className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full hover:bg-white/15"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
