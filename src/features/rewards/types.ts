/** "Rewards & coupons" — shared by the owner setup and every customer surface. */

export type DiscountType = 'percent' | 'flat'

/** One % / ₹ rule. `max_off` caps a percentage. */
export interface RewardRuleBase {
  type: DiscountType
  value: number
  max_off?: number | null
}

export interface BillDiscountRule extends RewardRuleBase {
  min_bill: number
}

export interface ComebackRule extends RewardRuleBase {
  min_bill?: number | null
  /** Days the earned coupon stays valid. */
  days: number
}

/** One step on the loyalty card: a reward on the `at`-th paid order. */
export interface LoyaltyStep extends RewardRuleBase {
  at: number
}

export interface LoyaltyRule {
  /** Sorted by `at`, one per order number. */
  steps: LoyaltyStep[]
  /** Start the card over after the last step (else each step is earned once). */
  repeat: boolean
}

/** A loyalty step as customers see it. */
export interface PublicLoyaltyStep {
  at: number
  label: string
  /** The signed-in customer has reached it in the current round. */
  reached: boolean
}

/** A loyalty reward the customer earned, shown as a scratch card. */
export interface ScratchCard {
  id: string
  tierAt: number | null
  title: string
  /** Null until scratched. */
  label: string | null
  code: string | null
  minBill: number | null
  revealed: boolean
  status: 'active' | 'used' | 'expired'
  expiresAt: string | null
  earnedAt: string | null
  business: { name: string; slug: string; logo: string | null } | null
}

/** One customer on the owner's repeat-customer list. */
export interface RepeatCustomer {
  name: string
  avatar: string | null
  orders: number
  spent: number
  lastOrderAt: string | null
  rewardsEarned: number
  rewardsUsed: number
  /** Orders into the current round of the card; null when loyalty is off. */
  position: number | null
  round: number | null
  finished: boolean
  next: { at: number; ordersLeft: number } | null
}

export interface RepeatCustomers {
  customers: RepeatCustomer[]
  summary: { customers: number; repeat: number; rewardsEarned: number; rewardsUsed: number }
}

export interface OwnerCoupon {
  id: string
  code: string
  title: string
  label: string
  discountType: DiscountType
  value: number
  maxDiscount: number | null
  minBill: number | null
  perCustomerLimit: number
  usageLimit: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  live: boolean
}

export interface OwnerRewards {
  billDiscount: BillDiscountRule | null
  comeback: ComebackRule | null
  loyalty: LoyaltyRule | null
  coupons: OwnerCoupon[]
  stats: { personalIssued: number; personalUsed: number }
  fees: { platformPercent: number; gatewayPercent: number }
}

export interface CouponFormValues {
  code: string
  title?: string
  discountType: DiscountType
  value: number
  maxDiscount?: number | null
  minBill?: number | null
  perCustomerLimit?: number
  usageLimit?: number | null
  expiresAt?: string | null
  active?: boolean
}

/** A coupon as a customer sees it. */
export interface PublicCoupon {
  code: string
  title: string
  kind: 'code' | 'comeback' | 'loyalty'
  label: string
  minBill: number | null
  expiresAt: string | null
  /** Earned by this customer (vs a code anyone can use). */
  personal: boolean
}

/** What ordering at a shop gets you — the shop page's "why order here". */
export interface ShopPerks {
  billDiscount: { minBill: number; label: string } | null
  comeback: { days: number; minBill: number | null; label: string } | null
  loyalty: {
    steps: PublicLoyaltyStep[]
    repeat: boolean
    /** Orders in one round of the card (the last step's number). */
    every: number
    /** Paid orders into the current round; null for a guest. */
    done: number | null
    totalOrders: number | null
    round: number | null
    /** A one-time card the customer has completed. */
    finished: boolean
    next: (PublicLoyaltyStep & { ordersLeft: number }) | null
    /** The next step's reward (or the first, for a guest). */
    label: string
  } | null
  coupons: PublicCoupon[]
}

/** The server's price for a cart (POST /orders/quote). Coins come off `total`. */
export interface CartQuote {
  subtotal: number
  billDiscount: number
  billNudge: { needed: number; minBill: number; label: string } | null
  coupon: PublicCoupon | null
  couponDiscount: number
  couponError: string | null
  savings: number
  deliveryFee: number
  comboCoinCap: number
  total: number
  coupons: (PublicCoupon & { minBillMet: boolean; saves: number })[]
  /** What this order earns for next time. */
  next?: { comeback: ShopPerks['comeback']; loyalty: ShopPerks['loyalty'] }
}
