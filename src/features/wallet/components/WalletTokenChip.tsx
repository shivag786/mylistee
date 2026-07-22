import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Ticket } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { useWalletToken, formatCountdown } from '../hooks/useWalletToken'

/**
 * Floating wallet-token pill (Phase 7.3). Always-visible for signed-in customers
 * so they can show their token at the counter; tap to open the wallet. Hidden on
 * the wallet page (the full card lives there).
 */
export function WalletTokenChip() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const isCustomer = user?.role === 'customer'
  const active = isAuthenticated && isCustomer && location.pathname !== ROUTES.wallet
  const { token, remaining } = useWalletToken(active)

  if (!active || !token) return null

  return (
    <motion.button
      type="button"
      onClick={() => navigate(ROUTES.wallet)}
      initial={reduce ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-[84px] z-30 mx-auto flex w-max items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 shadow-floating backdrop-blur"
      aria-label={`Your wallet token ${token.token}, expires in ${formatCountdown(remaining)}`}
    >
      <Ticket className="size-4 text-primary" aria-hidden />
      <span className="text-caption text-text-secondary">Token</span>
      <span className="font-mono text-body font-bold tracking-wider text-foreground">{token.token}</span>
      <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-small font-medium text-primary">
        {formatCountdown(remaining)}
      </span>
    </motion.button>
  )
}
