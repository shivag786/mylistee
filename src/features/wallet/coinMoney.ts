/**
 * Coins are money. Everywhere a balance shows, lead with the rupees it is worth
 * ("₹120") and keep the coin count as the detail ("120 coins") — people act on
 * an amount, not on points.
 */
import { useAppConfig } from '@/hooks/useAppConfig'

/** ₹ per coin, from /config (admin-set). */
export function useCoinValue(): number {
  const { data } = useAppConfig()
  return data?.coins?.value ?? 1
}

/** Coins a new account starts with, from /config. */
export function useWelcomeCoins(): number {
  const { data } = useAppConfig()
  return data?.coins?.enabled === false ? 0 : (data?.coins?.welcome ?? 0)
}

export function coinsToRupees(coins: number, coinValue: number): number {
  return Math.round(coins * coinValue * 100) / 100
}

/** "₹1,250" / "₹12.5" — Indian grouping, no needless decimals. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}
