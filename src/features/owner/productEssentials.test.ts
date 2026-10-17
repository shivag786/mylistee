import { describe, expect, it } from 'vitest'
import { applyDiscount, filledOptions, pricing, validateEssentials } from './productEssentials'

const base = { image: null, name: 'Pizza', price: '200', discount: null, foodType: null, section: { id: null, name: null } }

describe('product pricing', () => {
  it('applies % and ₹ discounts, never below zero', () => {
    expect(applyDiscount(200, { type: 'percent', value: 10 })).toBe(180)
    expect(applyDiscount(200, { type: 'flat', value: 30 })).toBe(170)
    expect(applyDiscount(20, { type: 'flat', value: 30 })).toBe(0)
    expect(applyDiscount(200, null)).toBe(200)
  })

  it('keeps an MRP only when a discount lowers the price', () => {
    expect(pricing(200, { type: 'percent', value: 25 })).toEqual({ mrp: 200, sellingPrice: 150 })
    expect(pricing(200, null)).toEqual({ mrp: null, sellingPrice: 200 })
  })

  it('ignores blank size rows', () => {
    expect(filledOptions([{ name: 'Large', price: '300' }, { name: '', price: '10' }, { name: 'Half', price: '' }])).toEqual([
      { name: 'Large', price: 300 },
    ])
  })

  it('needs a name and price, and a sane discount', () => {
    expect(validateEssentials(base)).toEqual({})
    expect(validateEssentials({ ...base, name: ' ', price: '' })).toMatchObject({ name: expect.any(String), price: expect.any(String) })
    expect(validateEssentials({ ...base, discount: { type: 'flat', value: 250 } }).discount).toBeDefined()
    expect(validateEssentials({ ...base, discount: { type: 'percent', value: 95 } }).discount).toBeDefined()
  })
})
