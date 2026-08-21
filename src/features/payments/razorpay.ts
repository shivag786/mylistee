/**
 * Razorpay Checkout — script loading and the shape of the global it installs.
 *
 * The script is loaded on demand rather than from index.html: it is ~100 KB that
 * only business owners on the plans screen ever need, and the customer PWA is the
 * bundle we care about keeping small (Milestone 15 §Code splitting).
 *
 * Nothing here decides anything about money. Checkout hands back a signed
 * order/payment pair which only the server can validate — see
 * SubscriptionPaymentService::verify() in the backend.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/** Options we hand to Checkout. Amounts are in paise, exactly as the API returns them. */
export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  handler: (response: RazorpayHandlerResponse) => void
  prefill?: { name?: string; email?: string; contact?: string }
  notes?: Record<string, string>
  theme?: { color?: string }
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean }
}

/** What Checkout returns on success — the handshake the server must verify. */
export interface RazorpayHandlerResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface RazorpayFailure {
  error: {
    code?: string
    description?: string
    reason?: string
    metadata?: { order_id?: string; payment_id?: string }
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayFailure) => void) => void
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

/**
 * In-flight load, shared between callers. Two plan cards tapped quickly must not
 * inject the script twice.
 */
let loader: Promise<RazorpayConstructor> | null = null

/**
 * Load Razorpay Checkout, resolving with its constructor.
 *
 * Rejects rather than hanging when the script cannot load — an owner behind a
 * blocked CDN gets a real error message instead of a button that does nothing.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (loader) return loader

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    const script = existing ?? document.createElement('script')

    script.addEventListener('load', () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Payment window failed to start. Please try again.'))
    })
    script.addEventListener('error', () => {
      // Let the next attempt retry from scratch instead of caching the failure.
      loader = null
      reject(
        new Error('Could not reach the payment provider. Check your connection and try again.'),
      )
    })

    if (!existing) {
      script.src = CHECKOUT_SRC
      script.async = true
      document.head.appendChild(script)
    }
  })

  return loader
}
