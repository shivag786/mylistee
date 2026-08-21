/**
 * Subscription & billing API (Milestone 13). Service-layer rule: UI never calls
 * the API directly (document/phase/04). Backend is the source of truth for plan
 * limits — the client only displays and requests changes.
 */
import { apiClient } from '@/services/apiClient'
import type {
  CheckoutSession,
  Invoice,
  PaymentHandshake,
  Plan,
  SubscriptionState,
} from '../types'

export const subscriptionService = {
  getState(): Promise<SubscriptionState> {
    return apiClient.get<SubscriptionState>('business/subscription')
  },

  listPlans(): Promise<Plan[]> {
    return apiClient.get<Plan[]>('plans', { auth: false })
  },

  /**
   * Switch plan without paying. Valid for the Free plan; the API refuses a paid
   * plan here once Razorpay is configured, which is why paid upgrades go through
   * `checkout` + `verify` instead.
   */
  subscribe(planKey: string): Promise<SubscriptionState> {
    return apiClient.post<SubscriptionState>('business/subscription', { planKey })
  },

  /** Open a Razorpay order for a paid plan. Nothing is charged yet. */
  createCheckout(planKey: string): Promise<CheckoutSession> {
    return apiClient.post<CheckoutSession>('business/subscription/checkout', { planKey })
  },

  /**
   * Hand the signed Checkout response back for verification. The plan only goes
   * live if the server can validate the signature *and* confirm the capture with
   * Razorpay — so a failure here means the plan was not activated.
   */
  verifyPayment(handshake: PaymentHandshake): Promise<SubscriptionState> {
    return apiClient.post<SubscriptionState>('business/subscription/verify', handshake)
  },

  /**
   * Report an attempt Checkout said failed. Best-effort bookkeeping so support
   * can see the attempt — never let a failure here mask the original error.
   */
  reportPaymentFailure(orderId: string, code?: string, description?: string): Promise<void> {
    return apiClient
      .post<void>('business/subscription/payment-failed', {
        razorpayOrderId: orderId,
        code,
        description,
      })
      .catch(() => undefined)
  },

  cancel(): Promise<SubscriptionState> {
    return apiClient.post<SubscriptionState>('business/subscription/cancel')
  },

  listInvoices(): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>('business/invoices')
  },
}
