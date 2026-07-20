/**
 * Reward / offer types (document/phase/02 §Offer Types).
 * Adding a new type must never require a schema change — this is the
 * single client-side registry of known types.
 */
export const OFFER_TYPES = {
  PERCENTAGE_DISCOUNT: 'percentage_discount',
  FLAT_DISCOUNT: 'flat_discount',
  BUY_ONE_GET_ONE: 'bogo',
  COMBO: 'combo',
  FREE_ITEM: 'free_item',
  CASHBACK: 'cashback',
  WALLET_REWARD: 'wallet_reward',
  FESTIVAL: 'festival',
  LIMITED_QUANTITY: 'limited_quantity',
  MYSTERY: 'mystery',
} as const

export type OfferType = (typeof OFFER_TYPES)[keyof typeof OFFER_TYPES]

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  percentage_discount: 'Percentage Off',
  flat_discount: 'Flat Discount',
  bogo: 'Buy 1 Get 1',
  combo: 'Combo Offer',
  free_item: 'Free Item',
  cashback: 'Cashback',
  wallet_reward: 'Wallet Reward',
  festival: 'Festival Special',
  limited_quantity: 'Limited Reward',
  mystery: 'Mystery Reward',
}
