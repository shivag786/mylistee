import { useCallback, useEffect, useState } from 'react'
import { storage } from '@/utils/storage'

/** The non-standard beforeinstallprompt event (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'listee.pwa.install-dismissed'

/**
 * Captures the browser's install prompt (document/phase/11 §Install Prompt).
 * Exposes whether the app can be installed and a function to trigger the native
 * prompt. A user dismissal is remembered so we don't nag.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(() => storage.get(DISMISS_KEY) === '1')

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
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
    canInstall: deferred !== null && !dismissed,
    promptInstall,
    dismiss,
  }
}
