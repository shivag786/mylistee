import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/icons/Logo'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { REDIRECT_IN_PROGRESS } from '@/features/auth/services/firebaseAuth'
import { landingPathForRole } from '@/features/auth/roleRoutes'
import { rememberPostLoginTarget } from '@/features/auth/postLoginTarget'
import { firebaseErrorMessage, isCancelledSignIn } from '@/utils/firebaseErrors'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { fadeInUp } from '@/animations'
import { DevLoginPanel } from './DevLoginPanel'
import { CustomerMobileAuth } from '@/features/auth/components/CustomerMobileAuth'
import { readPostLoginTarget } from '@/features/auth/postLoginTarget'
import { useAppConfig } from '@/hooks/useAppConfig'
import type { AuthUser } from '@/features/auth/types'

interface LocationState {
  from?: { pathname: string }
}

/**
 * Customer sign-in, with the option to keep browsing as a guest.
 *
 * What it offers is the admin's choice: Google, mobile + PIN, or both. Until the
 * config arrives it assumes Google, which is all an older API ever had -- so a
 * slow config call shows the familiar button rather than an empty page.
 */
export function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: config } = useAppConfig()

  const showGoogle = config?.auth?.google ?? true
  const showMobile = config?.auth?.mobile ?? false

  const from = (location.state as LocationState | null)?.from?.pathname

  /** Where to go once signed in, however they signed in. */
  function finish(user: AuthUser) {
    toast.success(MESSAGES.success.signedIn)
    // A cart sent here because Google was off remembered its shop; honour that.
    navigate(from ?? readPostLoginTarget() ?? landingPathForRole(user.role), { replace: true })
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    // Stash the destination before we start: if this device falls back to the
    // full-page redirect, `location.state` dies with the page and only this
    // survives the trip to Google. Written on every attempt, so it can never
    // be a leftover from an earlier one.
    rememberPostLoginTarget(from)
    try {
      const user = await signInWithGoogle()
      toast.success(MESSAGES.success.signedIn)
      navigate(from ?? landingPathForRole(user.role), { replace: true })
    } catch (err) {
      if (err instanceof Error && err.message === REDIRECT_IN_PROGRESS) return
      if (isCancelledSignIn(err)) {
        setLoading(false)
        return
      }
      setError(err instanceof ApiError ? err.message : firebaseErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-10">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-3 text-center"
      >
        <Logo size={64} />
        <h1 className="text-title font-bold text-foreground">Welcome to Listee</h1>
        <p className="max-w-xs text-body text-text-secondary">
          Scan, spin and win rewards at local businesses near you.
        </p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm space-y-3"
      >
        {showGoogle && (
          <Button
            fullWidth
            isLoading={loading}
            onClick={handleGoogle}
            leftIcon={<GoogleIcon />}
            className="text-white"
          >
            {MESSAGES.cta.signInGoogle}
          </Button>
        )}

        {error && (
          <p role="alert" className="text-center text-caption text-danger">
            {error}
          </p>
        )}

        {showGoogle && showMobile && (
          <div className="flex items-center gap-3 text-small text-text-muted" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {showMobile && <CustomerMobileAuth onSignedIn={finish} />}

        {/* Skip — keep browsing as a guest */}
        <Button
          variant="ghost"
          fullWidth
          className="underline underline-offset-4"
          onClick={() => navigate(ROUTES.home, { replace: true })}
        >
          Skip for now
        </Button>

        <p className="text-center text-small text-text-muted">
          By continuing you agree to our{' '}
          <Link to={ROUTES.terms} className="font-medium text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link to={ROUTES.privacy} className="font-medium text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-center text-small text-text-muted">
          Business owner?{' '}
          <Link to={ROUTES.ownerLogin} className="font-medium text-foreground hover:underline">
            Sign in here
          </Link>
        </p>

        {import.meta.env.DEV && <DevLoginPanel from={from} />}
      </motion.div>

      <LegalFooter className="w-full border-0 bg-transparent py-0" />
    </div>
  )
}
