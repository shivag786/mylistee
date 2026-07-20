/** Shared status enums used across features. */

export const REWARD_STATUS = {
  ACTIVE: 'active',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
} as const
export type RewardStatus = (typeof REWARD_STATUS)[keyof typeof REWARD_STATUS]

export const BUSINESS_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const
export type BusinessStatus = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS]

export const OFFER_STATUS = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  SOLD_OUT: 'sold_out',
} as const
export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS]
