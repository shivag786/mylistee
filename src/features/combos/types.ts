/** Home "Meal combos" feed (active combos across shops). */

export interface ComboDealItem {
  productId: string | null
  name: string | null
  imageUrl: string | null
  sellingPrice: number | null
  quantity: number
}

export interface ComboDeal {
  id: string
  name: string
  imageUrl: string | null
  comboPrice: number
  totalPrice: number
  savings: number
  items: ComboDealItem[]
  business: {
    slug: string
    name: string
    logo: string | null
    /** From the viewer's location; null when it isn't known. */
    distanceMeters?: number | null
    /** The viewer follows this shop. */
    isFollowed?: boolean
  }
}
