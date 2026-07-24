/** Home "Today's Deals" feed (product promotions running now). */

export interface Deal {
  id: string
  name: string
  imageUrl: string | null
  sellingPrice: number
  mrp: number | null
  /** Price after the best active promotion. */
  effectivePrice: number
  /** Percent off the normal selling price. */
  discountPercent: number
  offer: {
    name: string
    /** Machine type, e.g. "percentage", "quantity_discount". */
    type: string
    /** Human type, e.g. "Percentage discount", "Quantity discount". */
    typeLabel: string
    /** Short offer label, e.g. "20% OFF", "Buy 2+ · ₹50 off", "Buy 1 Get 1". */
    label: string
    /** When the promotion ends (ISO), or null if open-ended. */
    endsAt: string | null
  } | null
  business: {
    slug: string
    name: string
    logo: string | null
    area: string | null
  }
}
