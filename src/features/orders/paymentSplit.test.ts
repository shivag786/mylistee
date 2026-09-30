/**
 * The cart's preview must land on the same numbers as the server, or the
 * customer sees one amount in the cart and another on the Razorpay screen.
 * These pin the cases the server tests pin too.
 */
import { describe, expect, it } from 'vitest'
import type { PublicPaymentOptions } from '@/features/businesses/publicTypes'
import { defaultChoice, splitPayment } from './paymentSplit'

const full: PublicPaymentOptions = {
  onlineAvailable: true,
  codAvailable: true,
  paymentMode: 'full',
  partialPercent: 50,
  feePercent: 2,
}

describe('splitPayment', () => {
  it('takes the whole total online, with the fee on top', () => {
    expect(splitPayment(200, 'online', full)).toEqual({
      online: 200,
      fee: 4,
      atCounter: 0,
      chargedNow: 204,
    })
  })

  it('rounds a partial advance up to the rupee, as the server does', () => {
    // 30% of 199 = 59.70 → 60. Same as OrderPaymentTest's partial case.
    const split = splitPayment(199, 'online', { ...full, paymentMode: 'partial', partialPercent: 30 })
    expect(split.online).toBe(60)
    expect(split.atCounter).toBe(139)
  })

  it('charges nothing online for cash', () => {
    expect(splitPayment(200, 'cod', full)).toEqual({ online: 0, fee: 0, atCounter: 200, chargedNow: 0 })
  })

  it('falls back to cash when the gateway is not connected', () => {
    expect(splitPayment(200, 'online', { ...full, onlineAvailable: false }).online).toBe(0)
  })

  it('charges nothing online when the share is below the gateway minimum', () => {
    // A cart paid off with coins leaves nothing worth a Razorpay order.
    expect(splitPayment(0.5, 'online', full)).toEqual({ online: 0, fee: 0, atCounter: 0.5, chargedNow: 0 })
  })

  it('keeps an out-of-range percent inside the bounds the server enforces', () => {
    expect(splitPayment(100, 'online', { ...full, paymentMode: 'partial', partialPercent: 99 }).online).toBe(90)
  })

  it('treats an API from before online payment as cash only', () => {
    expect(splitPayment(200, 'online', undefined).online).toBe(0)
  })
})

describe('defaultChoice', () => {
  it('starts on online when the shop offers it', () => {
    expect(defaultChoice(full)).toBe('online')
  })

  it('starts on cash when online is not on offer', () => {
    expect(defaultChoice({ ...full, onlineAvailable: false })).toBe('cod')
    expect(defaultChoice(undefined)).toBe('cod')
  })
})
