import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Home } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { PinLoginForm } from '@/features/auth/components/PinLoginForm'
import { ROUTES } from '@/constants/routes'
import { fadeInUp } from '@/animations'

// Demo admin (seeded by DemoAccountSeeder). Shown only in demo mode.
const DEMO_ADMIN = { mobile: '9000000001', pin: '1234' }
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

/**
 * Staff sign-in — a single mobile + PIN link for **both** business owners and
 * platform admins. The shared `/auth/pin-login` endpoint authenticates either
 * role, and `PinLoginForm` routes each to the right panel (owner app / admin
 * panel) based on their role after signing in.
 */
export function OwnerLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-10">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-3 text-center"
      >
        <Logo size={56} />
        <h1 className="text-title font-bold text-foreground">Sign in</h1>
        <p className="max-w-xs text-body text-text-secondary">
          For business owners and platform admins.
        </p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm space-y-4"
      >
        {DEMO_MODE && (
          <div className="rounded-card border border-border bg-surface-muted/60 p-3 text-center text-small text-text-secondary">
            Demo admin — Mobile{' '}
            <code className="rounded bg-surface px-1 font-medium text-foreground">
              {DEMO_ADMIN.mobile}
            </code>{' '}
            · PIN{' '}
            <code className="rounded bg-surface px-1 font-medium text-foreground">
              {DEMO_ADMIN.pin}
            </code>
          </div>
        )}

        <PinLoginForm submitLabel="Sign in" submitIcon={<LogIn className="size-4" aria-hidden />} />

        <p className="text-center text-caption text-text-secondary">
          New to Listee?{' '}
          <Link to={ROUTES.ownerSignup} className="font-medium text-primary hover:underline">
            Register your business
          </Link>
        </p>

        <p className="text-center text-small text-text-muted">
          Are you a customer?{' '}
          <Link to={ROUTES.login} className="font-medium text-foreground hover:underline">
            Sign in here
          </Link>
        </p>

        <Link
          to={ROUTES.home}
          className="flex items-center justify-center gap-1.5 pt-1 text-caption text-text-secondary hover:text-foreground"
        >
          <Home className="size-4" aria-hidden />
          Go to Listee home
        </Link>
      </motion.div>
    </div>
  )
}
