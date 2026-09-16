/**
 * Sign in with Google without leaving the page.
 *
 * Built for actions a signed-out visitor takes mid-browse — following a shop,
 * say. Sending them to /login and back would cost them their place on the page
 * (and, on a shop profile, the thing they were looking at). This asks in a
 * dialog instead, signs them in through the popup flow, and hands control
 * straight back to whatever they were trying to do.
 *
 * On devices that cannot open a popup the Firebase layer falls back to a
 * full-page redirect, which does leave the page. `returnTo` is remembered for
 * that case so they come back to where they were rather than the home screen.
 */
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { useAuth } from '../hooks/useAuth'
import { REDIRECT_IN_PROGRESS } from '../services/firebaseAuth'
import { rememberPostLoginTarget } from '../postLoginTarget'
import { firebaseErrorMessage, isCancelledSignIn } from '@/utils/firebaseErrors'
import { MESSAGES } from '@/constants/messages'
import { ApiError } from '@/types/api'

interface GoogleSignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Why they are being asked — shown under the title. */
  reason?: string
  /** Where to return after a redirect-based sign-in. Defaults to the current page. */
  returnTo?: string
  /** Runs after a successful popup sign-in, so the original action can continue. */
  onSignedIn?: () => void | Promise<void>
}

export function GoogleSignInDialog({
  open,
  onOpenChange,
  reason = 'Sign in to continue.',
  returnTo,
  onSignedIn,
}: GoogleSignInDialogProps) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    rememberPostLoginTarget(returnTo ?? `${window.location.pathname}${window.location.search}`)
    try {
      await signInWithGoogle()
      onOpenChange(false)
      await onSignedIn?.()
    } catch (err) {
      // The page is navigating to Google; leave the dialog as it is.
      if (err instanceof Error && err.message === REDIRECT_IN_PROGRESS) return
      if (isCancelledSignIn(err)) {
        setLoading(false)
        return
      }
      setError(err instanceof ApiError ? err.message : firebaseErrorMessage(err))
      setLoading(false)
      return
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Sign in to Listee</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>

        <Button
          fullWidth
          isLoading={loading}
          onClick={handleSignIn}
          leftIcon={<GoogleIcon />}
          className="text-white"
        >
          {MESSAGES.cta.signInGoogle}
        </Button>

        {error && (
          <p role="alert" className="text-center text-caption text-danger">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
