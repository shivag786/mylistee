/** Combo builder types (Phase 7.3). */

export interface ComboItem {
  productId: string
  name: string | null
  imageUrl: string | null
  sellingPrice: number | null
  quantity: number
}

export interface Combo {
  id: string
  name: string
  imageUrl: string | null
  comboPrice: number
  totalPrice: number
  totalMrp: number
  savings: number
  coinsEarned: number | null
  walletCoinsAccepted: boolean
  /** Max Listee coins a customer may spend on this combo (0 = none). */
  coinsAccepted: number
  nextVisitCoupon: string | null
  bonusReward: string | null
  items: ComboItem[]
  startsAt: string | null
  endsAt: string | null
  autoEnable: boolean
  autoDisable: boolean
  isVisible: boolean
  isActiveNow: boolean
  position: number
}

export interface ComboItemInput {
  product_id: string
  quantity: number
}

export interface ComboFormValues {
  name: string
  combo_price: number
  product_category_id?: string | null
  coins_earned?: number | null
  wallet_coins_accepted?: boolean
  coins_accepted?: number | null
  next_visit_coupon?: string | null
  bonus_reward?: string | null
  starts_at?: string | null
  ends_at?: string | null
  auto_enable?: boolean
  auto_disable?: boolean
  is_visible?: boolean
  items: ComboItemInput[]
  image?: File | null
}
