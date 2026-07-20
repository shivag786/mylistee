import { describe, it, expect } from 'vitest'
import { formatPrice, featureLabel, intervalSuffix, formatLimit } from './planDisplay'

describe('planDisplay', () => {
  it('formats INR prices, with Free for zero', () => {
    expect(formatPrice(0)).toBe('Free')
    expect(formatPrice(499)).toBe('₹499')
    expect(formatPrice(1499)).toBe('₹1,499')
  })

  it('labels known features and humanizes unknown keys', () => {
    expect(featureLabel('analytics')).toBe('Full analytics dashboard')
    expect(featureLabel('some_new_thing')).toBe('some new thing')
  })

  it('renders the interval suffix', () => {
    expect(intervalSuffix('month')).toBe('/mo')
    expect(intervalSuffix('year')).toBe('/yr')
    expect(intervalSuffix('lifetime')).toBe('')
  })

  it('treats a null limit as unlimited', () => {
    expect(formatLimit(null, 'offers')).toBe('Unlimited offers')
    expect(formatLimit(3, 'offers')).toBe('3 offers')
  })
})
