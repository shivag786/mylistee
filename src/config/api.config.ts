/** HTTP client configuration for the Laravel API. */
import { env } from './env'

export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  /** Abort requests that exceed this (ms). */
  timeoutMs: 20000,
  /** localStorage key holding the Sanctum bearer token. */
  tokenStorageKey: 'listee.auth.token',
  defaultHeaders: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
} as const
