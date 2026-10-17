import type { RewardRuleBase } from './types'

const money = (n: number) => String(Math.round(n * 100) / 100)

/** "20% off up to ₹100", "₹50 off" — mirrors RewardRule::label() on the server. */
export function ruleLabel(rule: RewardRuleBase): string {
  if (rule.type === 'percent') {
    return rule.max_off ? `${money(rule.value)}% off up to ₹${money(rule.max_off)}` : `${money(rule.value)}% off`
  }
  return `₹${money(rule.value)} off`
}

/**
 * What a shop keeps from one unit at `price` once Listee's fee is out:
 * platform share always, the gateway's share only when paid online.
 */
export function shopEarning(price: number, fees: { platformPercent: number; gatewayPercent: number }) {
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    cash: round(price * (1 - fees.platformPercent / 100)),
    online: round(price * (1 - (fees.platformPercent + fees.gatewayPercent) / 100)),
  }
}

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th, 21st. */
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}
