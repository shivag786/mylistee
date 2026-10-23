import { afterEach, describe, expect, it } from 'vitest'
import { isValidPhone, normalisePhone, readSavedDelivery, saveDelivery } from './deliveryDraft'

describe('delivery details', () => {
  afterEach(() => localStorage.clear())

  it('keeps the last ten digits of a pasted number', () => {
    expect(normalisePhone('+91 98765 43210')).toBe('9876543210')
    expect(normalisePhone('09876543210')).toBe('9876543210')
  })

  it('accepts only Indian mobile numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true)
    expect(isValidPhone('1234567890')).toBe(false)
    expect(isValidPhone('98765')).toBe(false)
  })

  it('remembers the last delivery and falls back to the account number', () => {
    expect(readSavedDelivery('+91 91234 56780')).toEqual({ address: '', phone: '9123456780', point: null })

    saveDelivery({ address: '12 MG Road', phone: '9876543210', point: { lat: 12.97, lng: 77.59 } })
    expect(readSavedDelivery('9123456780')).toEqual({
      address: '12 MG Road',
      phone: '9876543210',
      point: { lat: 12.97, lng: 77.59 },
    })
  })
})
