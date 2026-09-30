/**
 * Place an order and, when part of it is paid online, take that payment.
 *
 * place → (if the order is waiting on money) open Razorpay → verify. One
 * mutation, so the cart has a single pending state and a single error path; the
 * steps are exposed as `stage` for the button label.
 *
 * The browser only carries messages here. An order is paid because the server
 * checked the signature and asked Razorpay, never because Checkout said so --
 * this hook just believes the order that comes back from verify.
 */
import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { loadRazorpay, type RazorpayHandlerResponse } from '@/features/payments/razorpay'
import type { Order } from '@/features/owner/orderTypes'
import { customerOrderService, type PlaceOrderPayload } from './customerOrderService'

export type OrderCheckoutStage = 'idle' | 'placing' | 'paying' | 'verifying'

/**
 * The customer closed the payment window. Not a failure worth an error toast:
 * the order has already been withdrawn and its coins returned.
 */
export class OrderPaymentCancelled extends Error {
  constructor() {
    super('Payment cancelled.')
    this.name = 'OrderPaymentCancelled'
  }
}

export function useOrderCheckout() {
  const [stage, setStage] = useState<OrderCheckoutStage>('idle')

  /**
   * Checkout fires `ondismiss` when the modal closes -- including right after a
   * successful payment. Without this guard that would release an order the
   * customer had just paid for.
   */
  const settled = useRef(false)

  const mutation = useMutation<Order, Error, PlaceOrderPayload>({
    mutationFn: async (payload) => {
      setStage('placing')
      const order = await customerOrderService.place(payload)

      // Cash, or an order whose online share came to nothing: already placed.
      if (order.status !== 'awaiting_payment') return order

      settled.current = false
      setStage('paying')

      // Load the SDK and open the Razorpay order together -- neither needs the other.
      const [Razorpay, session] = await Promise.all([
        loadRazorpay(),
        customerOrderService.startPayment(order.id),
      ]).catch(async (error: unknown) => {
        // Could not even open the window: take the order back rather than leave
        // it waiting on a payment the customer never had a chance to make.
        await customerOrderService.releasePayment(order.id).catch(() => undefined)
        throw error
      })

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
              // Withdraw the order and hand the coins back. Best-effort: the
              // server's sweep catches it anyway if this never arrives.
              void customerOrderService.releasePayment(order.id).catch(() => undefined)
              reject(new OrderPaymentCancelled())
            },
          },
        })

        // A failed attempt is not the end: Checkout keeps the window open so the
        // customer can try another card or UPI app. Only closing it ends the flow
        // -- and ondismiss handles that.
        checkout.on('payment.failed', () => undefined)

        checkout.open()
      })

      setStage('verifying')

      return customerOrderService.verifyPayment(order.id, {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      })
    },
    onSettled: () => setStage('idle'),
  })

  return {
    placeOrder: mutation.mutateAsync,
    stage,
    isPending: mutation.isPending,
  }
}

export function isOrderPaymentCancelled(error: unknown): boolean {
  return error instanceof OrderPaymentCancelled
}
