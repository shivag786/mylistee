/**
 * Application-level configuration and tunables.
 * Business limits live here (and ultimately come from the API/subscription
 * plan) so they are never hardcoded inside feature logic.
 */
import { env } from './env'

export const appConfig = {
  name: env.appName,
  tagline: 'Rewards Around You',
  /** Customer bottom navigation is capped at 5 tabs (document/phase/05). */
  maxBottomNavTabs: 5,
  /** Max content width on desktop (document-00A §5). */
  maxContentWidth: 1280,
  /** Default spins per customer per business per day on the free plan. */
  defaultDailySpinLimit: 1,
  /** Threshold above which a list should offer search (document-00B §17). */
  searchThreshold: 10,
  /** Reward celebration should stay under this (document-00B §14). */
  celebrationMaxMs: 3000,
  support: {
    email: 'support@listee.app',
  },
} as const

/**
 * Feature flags — flip to progressively roll out modules. Defaults reflect
 * v1 scope from the master prompts (dark mode & push are future-ready).
 */
export const featureFlags = {
  darkMode: false,
  pushNotifications: false,
  referrals: false,
  loyalty: false,
} as const

export type FeatureFlag = keyof typeof featureFlags
