/**
 * Stops the installed app from running once an admin turns the PWA off.
 *
 * Nothing can uninstall an app from someone's home screen remotely — that icon
 * keeps opening the site whatever we do. What we can do is refuse to run there
 * and say why, which is the difference between "switched off" and an app that
 * quietly keeps working after the switch was thrown.
 *
 * Only the installed app is blocked. The same site in a browser tab is a
 * website, not a PWA, so it carries on as normal — the flag governs the app,
 * not the business.
 *
 * The cached answer is used until the live one arrives, so a disabled app does
 * not get a working half second before the notice, and an enabled one never
 * flashes the notice while /config is in flight.
 */
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/icons/Logo'
import { usePwaEnabled } from './usePwaEnabled'
import { readCachedPwaEnabled } from './pwaFlagCache'
import { isStandalone } from './standalone'

export function PwaDisabledGate({ children }: { children: ReactNode }) {
  const live = usePwaEnabled()
  const [standalone, setStandalone] = useState(isStandalone)

  // Launching from the home screen can settle into standalone a beat after the
  // first render, so follow the media query rather than sampling it once.
  useEffect(() => {
    const mql = window.matchMedia?.('(display-mode: standalone)')
    const onChange = (e: MediaQueryListEvent) => setStandalone(e.matches)
    mql?.addEventListener?.('change', onChange)
    return () => mql?.removeEventListener?.('change', onChange)
  }, [])

  // Unknown counts as on, matching the manifest guard in index.html.
  const enabled = live ?? readCachedPwaEnabled() ?? true

  if (enabled || !standalone) return <>{children}</>

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-8 text-center">
      <Logo size={56} />
      <div className="space-y-2">
        <h1 className="text-title font-bold text-foreground">App service disabled</h1>
        <p className="max-w-xs text-body text-text-secondary">
          The Listee app has been switched off. You can still use Listee in your
          browser at <span className="font-semibold text-foreground">listee.org</span>.
        </p>
      </div>
      <p className="max-w-xs text-caption text-text-muted">
        You can remove this app from your home screen — nothing is lost, and your
        account stays exactly as it is.
      </p>
    </main>
  )
}
