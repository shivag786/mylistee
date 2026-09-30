/**
 * How an order's total splits for the payment the customer chose.
 *
 * A mirror of OrderPaymentService::split() and BusinessServiceSetting::
 * onlinePortion() on the server, which stays the authority -- it recomputes all
 * of this when the order is placed. This exists so the cart can show the same
 * numbers first; if the two ever disagreed, the customer would see one amount
 * in the cart and a different one on the Razorpay screen. Keep them in step.
 */
import type { PublicPaymentOptions } from '@/features/businesses/publicTypes'

export type PaymentChoice = 'online' | 'cod'

export interface PaymentSplit {
  /** Taken online now. */
  online: number
  /** Convenience fee, on top of `online`. Never part of the order total. */
  fee: number
  /** Collected in person. */
  atCounter: number
  /** What the Razorpay screen will show: online + fee. */
  chargedNow: number
}

/** Mirrors BusinessServiceSetting::PARTIAL_MIN / PARTIAL_MAX. */
const PARTIAL_MIN = 10
const PARTIAL_MAX = 90

/** Razorpay will not open an order below one rupee. */
const GATEWAY_MINIMUM = 1

const round2 = (n: number) => Math.round(n * 100) / 100

export function splitPayment(
  total: number,
  choice: PaymentChoice,
  options: PublicPaymentOptions | undefined,
): PaymentSplit {
  const whole = round2(total)
  const cash: PaymentSplit = { online: 0, fee: 0, atCounter: whole, chargedNow: 0 }

  if (choice === 'cod' || !options?.onlineAvailable) return cash

  let online = whole
  if (options.paymentMode === 'partial') {
    const percent = Math.max(PARTIAL_MIN, Math.min(PARTIAL_MAX, options.partialPercent))
    // Rounded up to the rupee, as the server does: a deposit reads as a whole
    // number, and rounding up never dips under the share the shop asked for.
    online = Math.min(whole, Math.ceil((whole * percent) / 100))
  }

  // Too small for the gateway -- nothing is charged online at all.
  if (online < GATEWAY_MINIMUM) return cash

  const fee = round2((online * options.feePercent) / 100)

  return {
    online,
    fee,
    atCounter: round2(whole - online),
    chargedNow: round2(online + fee),
  }
}

/**
 * The choice to start the cart on. Online when it is on offer -- it is what
 * the shop set up -- and otherwise cash, which the server guarantees is offered
 * whenever online is not.
 */
export function defaultChoice(options: PublicPaymentOptions | undefined): PaymentChoice {
  return options?.onlineAvailable ? 'online' : 'cod'
}
