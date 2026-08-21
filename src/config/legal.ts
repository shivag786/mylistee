/**
 * The company facts that appear in the legal pages, in one place.
 *
 * ⚠️ FILL THESE IN BEFORE GOING LIVE. Everything marked TODO is a placeholder —
 * a policy naming the wrong legal entity, address or grievance officer is not
 * enforceable, and payment providers verify these details against your
 * registration during onboarding.
 *
 * Kept as a module rather than env vars deliberately: this is public information
 * that belongs in version control, where a change to it is reviewable.
 */
export const LEGAL = {
  /** Consumer-facing product name. */
  brand: 'Listee',

  /** TODO: the registered legal entity that actually receives the money. */
  entity: 'Listee Technologies Private Limited',

  /** TODO: registered office, as filed. Required on the refund/contact pages. */
  address: '[Registered office address], India',

  /** TODO: CIN / LLPIN, if incorporated. Leave empty for a sole proprietorship. */
  cin: '',

  /** TODO: GSTIN, if registered. Shown on invoices and the terms page. */
  gstin: '',

  support: {
    email: 'support@listee.app',
    /** TODO: a number you actually answer — required by the consumer rules. */
    phone: '[Support phone number]',
    hours: 'Monday to Saturday, 10:00–19:00 IST',
  },

  /**
   * TODO: named grievance officer. Mandatory under the Consumer Protection
   * (E-Commerce) Rules 2020 and the IT Rules 2021 for anything operating in India.
   */
  grievance: {
    name: '[Grievance Officer name]',
    email: 'grievance@listee.app',
  },

  /** Courts with exclusive jurisdiction. TODO: match your registered office. */
  jurisdiction: 'Ahmedabad, Gujarat',

  /** Last review date for all three policies, shown at the top of each page. */
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
