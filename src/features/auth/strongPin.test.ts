/**
 * Mirrors the cases CustomerPinSafetyTest pins on the server. If these two ever
 * drift, the form would accept a PIN the server then refuses.
 */
import { describe, expect, it } from 'vitest'
import { weakPinReason } from './strongPin'

describe('weakPinReason', () => {
  it.each(['1234', '4321', '0000', '1111', '123456', '987654', '1212', '2580'])(
    'refuses %s, as the server does',
    (pin) => {
      expect(weakPinReason(pin)).not.toBeNull()
    },
  )

  it.each(['4816', '7391', '5829', '305728'])('accepts an ordinary PIN like %s', (pin) => {
    expect(weakPinReason(pin)).toBeNull()
  })

  it('leaves non-digits to the digits-only check', () => {
    expect(weakPinReason('12ab')).toBeNull()
  })
})
