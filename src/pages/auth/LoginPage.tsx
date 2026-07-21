import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { REDIRECT_IN_PROGRESS } from '@/features/auth/services/firebaseAuth'
import { landingPathForRole } from '@/features/auth/roleRoutes'
import { firebaseErrorMessage, isCancelledSignIn } from '@/utils/firebaseErrors'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { fadeInUp } from '@/animations'
import { DevLoginPanel } from './DevLoginPanel'

interface LocationState {
  from?: { pathname: string }
}

/** Customer sign-in — Google only, with the option to keep browsing as a guest. */
export function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as LocationState | null)?.from?.pathname

  async function handleGoogle() {
    setLoading(true)
    setError(null)
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
        <Button fullWidth isLoading={loading} onClick={handleGoogle}>
          {MESSAGES.cta.signInGoogle}
        </Button>

        {error && (
          <p role="alert" className="text-center text-caption text-danger">
            {error}
          </p>
        )}

        {/* Skip — keep browsing as a guest */}
        <Button variant="ghost" fullWidth onClick={() => navigate(ROUTES.home, { replace: true })}>
          Skip for now
        </Button>

        <p className="text-center text-small text-text-muted">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>

        <p className="text-center text-small text-text-muted">
          Business owner?{' '}
          <Link to={ROUTES.ownerLogin} className="font-medium text-foreground hover:underline">
            Sign in here
          </Link>
        </p>

        {import.meta.env.DEV && <DevLoginPanel from={from} />}
      </motion.div>
    </div>
  )
}
