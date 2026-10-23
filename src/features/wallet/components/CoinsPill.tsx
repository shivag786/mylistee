import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useCountUp } from '@/hooks/useCountUp'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCoinSummary } from '../hooks/useCoins'
import { coinsToRupees, formatRupees, useCoinValue, useWelcomeCoins } from '../coinMoney'
import { ListeeCoin } from './ListeeCoin'

/**
 * Top-bar wallet pill — the one lime element in the header, so the eye finds
 * it. Signed in: the balance as money ("₹120"). Guest: what signing up is
 * worth ("Get ₹50"), which is the reason to sign up.
 */
export function CoinsPill() {
  const { isAuthenticated } = useAuth()
  const { data } = useCoinSummary(isAuthenticated)
  const coinValue = useCoinValue()
  const welcome = useWelcomeCoins()
  const coins = data?.total ?? 0
  const rupees = useCountUp(coinsToRupees(coins, coinValue), 700)

  return (
    <Link
      to={isAuthenticated ? ROUTES.wallet : ROUTES.login}
      aria-label={
        isAuthenticated
          ? `Wallet — ${formatRupees(coinsToRupees(coins, coinValue))} (${coins} coins)`
          : 'Sign in to get your welcome coins'
      }
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold pl-1 pr-3 font-heading font-bold text-gold-foreground shadow-[0_2px_8px_rgba(132,204,22,0.35)] transition-transform hover:scale-[1.03] active:scale-95"
    >
      <ListeeCoin size={28} className="ring-2 ring-white/60" />
      {isAuthenticated ? (
        <span className="text-body tabular-nums">{formatRupees(Math.round(rupees))}</span>
      ) : (
        <span className="text-caption">{welcome > 0 ? `Get ${formatRupees(coinsToRupees(welcome, coinValue))}` : 'Wallet'}</span>
      )}
    </Link>
  )
}
