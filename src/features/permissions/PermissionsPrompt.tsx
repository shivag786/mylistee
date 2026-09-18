/**
 * Asks for location and notifications on the first visit to the home page.
 *
 * It appears on its own, but the native dialogs still open on a tap rather than
 * on load, and that part is not a style preference:
 *
 *  - Notification.requestPermission() needs a user gesture in Safari and iOS,
 *    where a call on load simply fails. Nothing would be asked at all.
 *  - Chrome scores sites that fire permission dialogs cold. Dismiss one twice
 *    and Chrome starts auto-blocking, which no amount of asking later undoes.
 *  - A denial is close to permanent: the app cannot re-prompt, and the user has
 *    to go into browser settings. Spending that one chance on a dialog nobody
 *    asked for, before the app has shown what it is for, is how you lose it.
 *
 * So the card is what arrives by default, and Allow opens the real dialogs.
 * Asking for both together means the shop list can sort by distance and the
 * offers can reach them, which is the reason to say yes.
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLocation } from '@/features/location/useAppLocation'
import { usePushRegistration } from '@/features/notifications/hooks/usePush'
import { storage } from '@/utils/storage'

const DISMISS_KEY = 'listee:permissions-prompt-dismissed'

/** Long enough for the page to paint first, so it reads as part of the app
 *  rather than something that ambushed them. */
const APPEAR_DELAY_MS = 1200

export function PermissionsPrompt() {
  const { status, request } = useAppLocation()
  // registerEffects stays with the app-wide registrar; this only needs enable().
  const { permission, enable } = usePushRegistration({ registerEffects: false })
  const [dismissed, setDismissed] = useState(() => storage.get(DISMISS_KEY) === '1')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setReady(true), APPEAR_DELAY_MS)
    return () => clearTimeout(id)
  }, [])

  // Nothing to ask for once the browser has an answer either way: 'denied' is
  // the browser's to change, not ours.
  const wantsLocation = status === 'idle'
  const wantsPush = permission === 'default'
  const show = ready && !dismissed && (wantsLocation || wantsPush)

  function dismiss() {
    storage.set(DISMISS_KEY, '1')
    setDismissed(true)
  }

  async function allow() {
    // Location first: its dialog is the one that changes what the page shows.
    if (wantsLocation) request()
    if (wantsPush) await enable().catch(() => undefined)
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="mx-auto w-full"
          role="region"
          aria-label="Enable location and notifications"
        >
          <div className="relative rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute right-2 top-2 rounded-full p-1.5 text-text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>

            <p className="pr-6 text-body font-semibold text-foreground">Get the best of Listee</p>

            <ul className="mt-2 space-y-1.5">
              {wantsLocation && (
                <li className="flex items-center gap-2 text-caption text-text-secondary">
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  See shops and offers nearest to you
                </li>
              )}
              {wantsPush && (
                <li className="flex items-center gap-2 text-caption text-text-secondary">
                  <Bell className="size-4 shrink-0 text-primary" aria-hidden />
                  Know when a shop near you posts a reward
                </li>
              )}
            </ul>

            <div className="mt-3 flex gap-2">
              <Button size="sm" fullWidth onClick={() => void allow()}>
                Allow
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
