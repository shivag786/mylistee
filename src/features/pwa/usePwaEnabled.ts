/**
 * Whether this app is allowed to behave as a PWA, per the admin's `pwa` feature
 * flag (Super Admin → Feature flags).
 *
 * Returns `undefined` until the answer is actually known. That third state
 * matters: the two actions here are opposites — registering a service worker
 * versus tearing one off every device — and guessing wrong in either direction
 * is destructive. So nothing happens until the config call comes back, and a
 * failed call leaves the device exactly as it is.
 */
import { useAppConfig } from '@/hooks/useAppConfig'

export function usePwaEnabled(): boolean | undefined {
  const { data, isError } = useAppConfig()
  if (isError) return undefined
  return data?.flags.pwa
}
