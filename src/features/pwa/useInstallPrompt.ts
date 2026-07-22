import { useCallback, useEffect, useState } from 'react'
import { storage } from '@/utils/storage'

/** The non-standard beforeinstallprompt event (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'listee.pwa.install-dismissed'

/** True when the app is currently running as an installed PWA. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Captures the browser's install prompt (document/phase/11 §Install Prompt).
 * Exposes whether the app can be installed and a function to trigger the native
 * prompt. A dismissal is remembered so we don't nag — BUT it is cleared on
 * install, so if the user later uninstalls/removes the PWA the browser fires
 * `beforeinstallprompt` again and the banner reappears.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(() => storage.get(DISMISS_KEY) === '1')
  const [standalone, setStandalone] = useState<boolean>(isStandalone)

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      // The event firing means the app is installable (i.e. NOT installed) — if
      // we're seeing it again after an install, the user has uninstalled.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setStandalone(false)
    }
    function onInstalled() {
      // Reset the dismissal so a future uninstall re-prompts, and hide the banner.
      storage.remove(DISMISS_KEY)
      setDismissed(false)
      setDeferred(null)
      setStandalone(true)
    }

    const mql = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayModeChange = (e: MediaQueryListEvent) => setStandalone(e.matches)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    mql?.addEventListener?.('change', onDisplayModeChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mql?.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice.catch(() => undefined)
    setDeferred(null)
  }, [deferred])

  const dismiss = useCallback(() => {
    storage.set(DISMISS_KEY, '1')
    setDismissed(true)
  }, [])

  return {
    // Never prompt while already installed; otherwise show unless dismissed.
    canInstall: deferred !== null && !dismissed && !standalone,
    promptInstall,
    dismiss,
  }
}
