import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

// Demo admin credentials (seeded by DemoAccountSeeder). Shown only in demo mode
// — dev, or a build with VITE_DEMO_MODE=true — never on a real production build.
const DEMO_ADMIN = { mobile: '9000000001', pin: '1234' }
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

export function LoginPage() {
  const { signInWithGoogle, pinLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as LocationState | null)?.from?.pathname

  async function handlePinLogin(identifier: string, secret: string) {
    if (!identifier || !secret) {
      setError('Enter your mobile number and PIN.')
      return
    }
    setError(null)
    setPinLoading(true)
    try {
      const user = await pinLogin(identifier, secret)
      toast.success(MESSAGES.success.signedIn)
      navigate(from ?? landingPathForRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Check your mobile and PIN.')
    } finally {
      setPinLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      const user = await signInWithGoogle()
      toast.success(MESSAGES.success.signedIn)
      navigate(from ?? landingPathForRole(user.role), { replace: true })
    } catch (err) {
      if (err instanceof Error && err.message === REDIRECT_IN_PROGRESS) return
      if (isCancelledSignIn(err)) {
        setGoogleLoading(false)
        return
      }
      setError(err instanceof ApiError ? err.message : firebaseErrorMessage(err))
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-10">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-3 text-center"
      >
        <Logo size={56} />
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
        className="w-full max-w-sm space-y-4"
      >
        {/* Business owner / admin — mobile + PIN */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handlePinLogin(mobile.trim(), pin.trim())
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input
              id="mobile"
              inputMode="tel"
              autoComplete="username"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Your registered mobile"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Default is 1234"
              maxLength={8}
            />
          </div>

          {error && (
            <p role="alert" className="text-center text-caption text-danger">
              {error}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={pinLoading}
            leftIcon={<Store className="size-4" aria-hidden />}
          >
            Sign in as business owner
          </Button>
        </form>

        <p className="text-center text-caption text-text-secondary">
          New to Listee?{' '}
          <Link to={ROUTES.ownerSignup} className="font-medium text-primary hover:underline">
            Register your business
          </Link>
        </p>

        {/* Customers */}
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-small uppercase tracking-wide text-text-muted">or</span>
          <Separator className="flex-1" />
        </div>

        <Button variant="outline" fullWidth isLoading={googleLoading} onClick={handleGoogle}>
          {MESSAGES.cta.signInGoogle}
        </Button>
        <p className="text-center text-small text-text-muted">
          Customers sign in with Google. By continuing you agree to our Terms &amp; Privacy Policy.
        </p>

        {/* Admin access — demo mode only */}
        {DEMO_MODE && (
        <div className="rounded-card border border-border bg-surface-muted/60 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-secondary" aria-hidden />
            <span className="text-caption font-semibold text-foreground">Admin access</span>
          </div>
          <p className="mt-1 text-small text-text-secondary">
            Mobile{' '}
            <code className="rounded bg-surface px-1 font-medium text-foreground">{DEMO_ADMIN.mobile}</code>{' '}
            · PIN{' '}
            <code className="rounded bg-surface px-1 font-medium text-foreground">{DEMO_ADMIN.pin}</code>
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            isLoading={pinLoading}
            onClick={() => void handlePinLogin(DEMO_ADMIN.mobile, DEMO_ADMIN.pin)}
          >
            Log in as admin
          </Button>
        </div>
        )}

        {import.meta.env.DEV && <DevLoginPanel from={from} />}
      </motion.div>
    </div>
  )
}
