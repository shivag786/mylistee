/**
 * Why a PIN is too easy to guess, or null when it is fine.
 *
 * A mirror of App\Rules\StrongPin on the server, which stays the authority and
 * refuses these regardless. It is here so the form can say so as the customer
 * types rather than after a round trip -- keep the two in step.
 *
 * The reason matters more than usual: with no OTP, a PIN is the whole of an
 * account's protection, and one common PIN tried across many numbers is how
 * accounts get taken.
 */

/** Common PINs that are neither a run nor a repeat, mirroring StrongPin::COMMON. */
const COMMON = new Set([
  '1212', '2121', '1122', '2211', '1010', '2020', '1313', '1414',
  '2580', '0852', '1379', '1397', '2468', '8642', '1470', '0741',
  '6969', '1004', '2000', '2001', '1999', '2525', '5683', '7890',
  '121212', '112233', '101010', '696969', '147258', '159753',
])

function isRun(pin: string, step: 1 | -1): boolean {
  for (let i = 1; i < pin.length; i++) {
    if (Number(pin[i]) - Number(pin[i - 1]) !== step) return false
  }
  return true
}

export function weakPinReason(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return null // the digits-only check reports this one

  if (/^(\d)\1+$/.test(pin)) return 'That PIN is too easy to guess -- avoid repeating one digit.'
  if (isRun(pin, 1) || isRun(pin, -1)) return 'That PIN is too easy to guess -- avoid digits in a row like 1234.'
  if (COMMON.has(pin)) return 'That PIN is too common. Please choose a less obvious one.'

  return null
}
