import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from './useInstallPrompt'

/**
 * Dismissible "Add to Home Screen" prompt (document/phase/11 §Install Prompt).
 * Sits above the bottom nav; only appears when the browser offers installation
 * and the user hasn't dismissed it.
 */
export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt()

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-[84px] z-50 mx-auto w-full max-w-md px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-floating">
            <Logo size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-foreground">Install Listee</p>
              <p className="text-caption text-text-secondary">Add to your home screen for quick access.</p>
            </div>
            <Button size="sm" leftIcon={<Download className="size-4" />} onClick={() => void promptInstall()}>
              Install
            </Button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismiss}
              className="rounded-full p-1 text-text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
