/**
 * The paid-upgrade flow, end to end.
 *
 * createCheckout → open Razorpay Checkout → verify the signed response → the
 * plan is live. Wrapped in one mutation so the screen has a single pending state
 * and a single error path; the multi-step progress is exposed as `stage` for the
 * button label.
 *
 * The browser is only a courier here. Checkout's response proves nothing on its
 * own — the plan changes because the *server* verified the signature and
 * confirmed the capture with Razorpay, and this hook simply trusts the
 * subscription state that comes back from that call.
 */
import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loadRazorpay, type RazorpayHandlerResponse } from '@/features/payments/razorpay'
import { subscriptionService } from '../services/subscriptionService'
import type { Plan, SubscriptionState } from '../types'
import { ownerKeys } from './useOwner'

/** What the button should say while the flow runs. */
export type CheckoutStage = 'idle' | 'creating' | 'awaiting' | 'verifying'

/**
 * Thrown when the owner simply closed the payment window. Not a failure worth an
 * error toast — the caller checks for it and stays quiet.
 */
export class CheckoutCancelled extends Error {
  constructor() {
    super('Payment cancelled.')
    this.name = 'CheckoutCancelled'
  }
}

export function isCheckoutCancelled(error: unknown): boolean {
  return error instanceof CheckoutCancelled
}

export function usePlanCheckout() {
  const qc = useQueryClient()
  const [stage, setStage] = useState<CheckoutStage>('idle')

  // Which plan is mid-flight, so only that card shows a spinner.
  const [activePlanKey, setActivePlanKey] = useState<string | null>(null)

  /**
   * Guards the dismiss handler: Checkout fires `ondismiss` when the modal closes
   * *including* right after a successful payment, which would otherwise cancel a
   * flow that actually succeeded.
   */
  const settled = useRef(false)

  const mutation = useMutation<SubscriptionState, Error, Plan>({
    mutationFn: async (plan) => {
      settled.current = false
      setActivePlanKey(plan.key)
      setStage('creating')

      // Load the SDK and create the order in parallel — neither needs the other.
      const [Razorpay, session] = await Promise.all([
        loadRazorpay(),
        subscriptionService.createCheckout(plan.key),
      ])

      setStage('awaiting')

      const response = await new Promise<RazorpayHandlerResponse>((resolve, reject) => {
        const checkout = new Razorpay({
          key: session.keyId,
          amount: session.amount,
          currency: session.currency,
          name: session.name,
          description: session.description,
          image: session.logo ?? undefined,
          order_id: session.orderId,
          prefill: session.prefill,
          notes: session.notes,
          theme: { color: session.themeColor ?? undefined },
          handler: (result) => {
            settled.current = true
            resolve(result)
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              if (settled.current) return
              settled.current = true
              reject(new CheckoutCancelled())
            },
          },
        })

        checkout.on('payment.failed', (failure) => {
          settled.current = true
          // Best-effort: log the attempt server-side, but surface Razorpay's own
          // reason to the owner either way.
          void subscriptionService.reportPaymentFailure(
            failure.error?.metadata?.order_id ?? session.orderId,
            failure.error?.code,
            failure.error?.description,
          )
          reject(new Error(failure.error?.description ?? 'The payment could not be completed.'))
        })

        checkout.open()
      })

      setStage('verifying')

      return subscriptionService.verifyPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      })
    },
    onSuccess: (state) => {
      qc.setQueryData(ownerKeys.subscription, state)
      void qc.invalidateQueries({ queryKey: ownerKeys.subscription })
      void qc.invalidateQueries({ queryKey: ownerKeys.invoices })
      void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
      void qc.invalidateQueries({ queryKey: ownerKeys.offers })
    },
    onSettled: () => {
      setStage('idle')
      setActivePlanKey(null)
    },
  })

  const start = useCallback(
    (plan: Plan, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      mutation.mutate(plan, {
        onSuccess: () => options?.onSuccess?.(),
        onError: (error) => {
          // A closed modal is a decision, not a failure.
          if (isCheckoutCancelled(error)) return
          options?.onError?.(error)
        },
      })
    },
    [mutation],
  )

  return {
    start,
    stage,
    activePlanKey,
    isPending: mutation.isPending,
  }
}
