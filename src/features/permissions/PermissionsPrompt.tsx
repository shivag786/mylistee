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
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MapPin, Bell, X, ShieldCheck, Sparkles } from 'lucide-react'
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
  const both = wantsLocation && wantsPush

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
          exit={{ y: 24, opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="mx-auto w-full"
          role="region"
          aria-label="Enable location and notifications"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
            {/* Header band */}
            <div className="relative bg-gradient-to-br from-gradient-from to-gradient-to px-4 pb-4 pt-4 text-white">
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
              >
                <X className="size-4" aria-hidden />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="flex -space-x-2" aria-hidden>
                  {wantsLocation && <PulseIcon icon={MapPin} />}
                  {wantsPush && <PulseIcon icon={Bell} delay={0.4} />}
                </span>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1 text-small font-medium opacity-90">
                    <Sparkles className="size-3.5" aria-hidden /> {both ? "2 taps, then you're set" : "One tap, then you're set"}
                  </p>
                  <p className="text-body-lg font-bold leading-tight">Get the best of Listee</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <ul className="space-y-2.5">
                {wantsLocation && (
                  <Benefit
                    icon={MapPin}
                    title="Shops near you"
                    text="See shops and offers nearest to you, sorted by distance."
                  />
                )}
                {wantsPush && (
                  <Benefit
                    icon={Bell}
                    title="Offers & order updates"
                    text="Know when a shop near you posts a reward, and when your order is ready."
                  />
                )}
              </ul>

              <div className="flex items-center gap-2">
                <Button fullWidth onClick={() => void allow()}>
                  Allow
                </Button>
                <Button variant="ghost" onClick={dismiss} className="shrink-0">
                  Not now
                </Button>
              </div>

              <p className="flex items-center gap-1.5 text-small text-text-muted">
                <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden />
                {wantsLocation
                  ? `Your location stays on your phone. Turn ${both ? 'either' : 'it'} off anytime.`
                  : 'Only shops you follow or order from can notify you. Turn it off anytime.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** One reason to say yes: icon tile, short title, one line of why. */
function Benefit({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-caption font-semibold text-foreground">{title}</span>
        <span className="block text-small text-text-secondary">{text}</span>
      </span>
    </li>
  )
}

/** A white icon disc with a soft ring pulsing out of it. */
function PulseIcon({ icon: Icon, delay = 0 }: { icon: typeof MapPin; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative grid size-11 place-items-center rounded-full bg-white text-primary shadow-lg ring-2 ring-white/40">
      {!reduce && (
        <motion.span
          className="absolute inset-0 rounded-full bg-white"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
        />
      )}
      <Icon className="relative size-5" aria-hidden />
    </span>
  )
}
