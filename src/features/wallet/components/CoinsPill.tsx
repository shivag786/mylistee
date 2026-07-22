import { Link } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useCountUp } from '@/hooks/useCountUp'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCoinSummary } from '../hooks/useCoins'

/**
 * Top-bar Listee Coins pill. Signed-in customers see their animated balance and
 * tap through to the wallet; guests see a prompt that routes to sign-in (the
 * wallet is auth-only).
 */
export function CoinsPill() {
  const { isAuthenticated } = useAuth()
  const { data } = useCoinSummary(isAuthenticated)
  const value = useCountUp(data?.total ?? 0, 700)

  return (
    <Link
      to={isAuthenticated ? ROUTES.wallet : ROUTES.login}
      aria-label={isAuthenticated ? `Wallet — ${data?.total ?? 0} coins` : 'Sign in to earn coins'}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-premium/15 px-3 font-semibold text-premium transition-colors hover:bg-premium/25"
    >
      <Coins className="size-4" aria-hidden />
      {isAuthenticated ? (
        <span className="text-body tabular-nums">{value.toLocaleString()}</span>
      ) : (
        <span className="text-caption">Coins</span>
      )}
    </Link>
  )
}
