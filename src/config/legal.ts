/**
 * The facts the legal pages quote, in one place.
 *
 * Kept as a module rather than env vars deliberately: this is public information
 * that belongs in version control, where a change to it is reviewable. Change a
 * value here and all three policies follow.
 *
 * Deliberately minimal — no registered entity, address, phone or grievance
 * officer. Those were removed on request. Note that an India-facing platform is
 * expected to publish a named grievance officer (Consumer Protection
 * (E-Commerce) Rules 2020, IT Rules 2021), and payment providers check for one
 * during onboarding, so plan to reinstate that block before launch.
 */
export const LEGAL = {
  /** Consumer-facing product name, used throughout the policies. */
  brand: 'Listee',

  /** The one contact route the policies point at, for refunds and data rights. */
  supportEmail: 'support@listee.app',

  /** Courts with exclusive jurisdiction, quoted in the Terms. */
  jurisdiction: 'Ahmedabad, Gujarat',

  /** Last review date, shown at the top of every policy page. */
  lastUpdated: '21 August 2026',

  /** Business-day windows quoted in the refund policy. */
  refund: {
    /** Cooling-off period after a first purchase. */
    coolingOffDays: 7,
    /** Working days for a decision after a refund request. */
    decisionDays: 5,
    /** Working days for the money to reach the original payment method. */
    settlementDays: 10,
  },
} as const
