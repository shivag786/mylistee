import { z } from 'zod'
import type { OfferType } from './types'

export const OFFER_TYPE_OPTIONS: { value: OfferType; label: string }[] = [
  { value: 'percentage', label: 'Percentage discount' },
  { value: 'flat', label: 'Flat discount' },
  { value: 'bogo', label: 'Buy one get one' },
  { value: 'combo', label: 'Combo offer' },
  { value: 'free_item', label: 'Free item' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'wallet_reward', label: 'Wallet reward' },
  { value: 'festival', label: 'Festival offer' },
  { value: 'mystery', label: 'Mystery reward' },
]

const offerTypeValues = OFFER_TYPE_OPTIONS.map((o) => o.value) as [OfferType, ...OfferType[]]

export const offerSchema = z.object({
  title: z.string().trim().min(2, 'Give your offer a title').max(255),
  type: z.enum(offerTypeValues),
  rewardValue: z.string().trim().max(255).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  startsAt: z.string().min(1, 'Choose a start date'),
  endsAt: z.string().min(1, 'Choose an end date'),
  totalQuantity: z
    .string()
    .trim()
    .refine((v) => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), 'Enter a whole number')
    .optional()
    .or(z.literal('')),
})

export type OfferSchema = z.infer<typeof offerSchema>

/** Today and +2 days as yyyy-mm-dd, honoring the 3-day free-plan window. */
export function defaultOfferDates(): { startsAt: string; endsAt: string } {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + 2)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { startsAt: iso(today), endsAt: iso(end) }
}
