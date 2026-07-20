/**
 * Subscription plan identifiers (document/phase/02 §Subscriptions).
 * Plan LIMITS are intentionally NOT hardcoded here — the API is the source
 * of truth so limits stay configurable. These are display identifiers only.
 */
export const PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type Plan = (typeof PLANS)[keyof typeof PLANS]

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}
