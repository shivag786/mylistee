/**
 * Personal link — store mode bought by the day. The owner switches it on (free
 * trial, once) and then buys 30 / 90 / 365-day packs with Razorpay. As with
 * plans, the browser only carries Checkout's signed response; days are added
 * only after the server verifies it (PersonalLinkService on the backend).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import { loadRazorpay, waitForPageInteractive, type RazorpayHandlerResponse } from '@/features/payments/razorpay'
import { CheckoutCancelled } from './hooks/usePlanCheckout'
import { ownerKeys } from './hooks/useOwner'
import type { PaymentHandshake } from './types'

export type PersonalLinkPackKey = 'month' | 'quarter' | 'year'

export interface PersonalLinkPack {
  key: PersonalLinkPackKey
  days: number
  price: number
  /** The same days at ₹5/day — shown struck through. */
  regularPrice: number
  perDay: number
}

export type PersonalLinkSource = 'trial' | 'online' | 'admin_free' | 'admin_link'

/** One package in the shop's history (trial, purchase, admin grant or admin payment link). */
export interface PersonalLinkGrant {
  id: string
  source: PersonalLinkSource
  /** pending = a payment link not paid yet; active = days added. */
  status: 'pending' | 'active' | 'cancelled'
  pack: PersonalLinkPackKey | null
  days: number
  amount: number
  /** Only while pending: the Razorpay page to pay on. */
  linkUrl: string | null
  note: string | null
  grantedBy: string | null
  expiresBefore: string | null
  expiresAfter: string | null
  appliedAt: string | null
  createdAt: string | null
}

export const GRANT_SOURCE_LABEL: Record<PersonalLinkSource, string> = {
  trial: 'Free trial',
  online: 'Bought online',
  admin_free: 'Given by Listee',
  admin_link: 'Payment link',
}

/** Where a new pack's days would end: on top of what is left, or from now. */
export function expiryAfterAdding(currentExpiry: string | null, days: number): Date {
  const now = Date.now()
  const from = currentExpiry && new Date(currentExpiry).getTime() > now ? new Date(currentExpiry).getTime() : now
  return new Date(from + days * 86_400_000)
}

export interface PersonalLinkState {
  enabled: boolean
  /** Enabled and has trial/paid days left — customers see only this shop. */
  active: boolean
  expiresAt: string | null
  daysLeft: number
  trialAvailable: boolean
  trialDays: number
  onTrial: boolean
  packs: PersonalLinkPack[]
  /** Razorpay is configured on the server. */
  paymentsLive: boolean
  /** Newest first. */
  history: PersonalLinkGrant[]
}

interface PackCheckout {
  keyId: string
  orderId: string
  amount: number
  currency: string
  name: string
  description: string
  themeColor: string | null
  logo: string | null
  prefill: { name: string; email: string; contact: string }
  notes: Record<string, string>
}

const KEY = ['owner', 'personal-link'] as const

export const personalLinkService = {
  get: () => apiClient.get<PersonalLinkState>('business/personal-link'),
  setEnabled: (enabled: boolean) => apiClient.put<PersonalLinkState>('business/personal-link', { enabled }),
  checkout: (pack: PersonalLinkPackKey) => apiClient.post<PackCheckout>('business/personal-link/checkout', { pack }),
  verify: (handshake: PaymentHandshake) => apiClient.post<PersonalLinkState>('business/personal-link/verify', handshake),
  reportFailure: (orderId: string, code?: string, description?: string) =>
    apiClient
      .post<void>('business/personal-link/payment-failed', { razorpayOrderId: orderId, code, description })
      .catch(() => undefined),
}

export function usePersonalLink() {
  return useQuery({ queryKey: KEY, queryFn: personalLinkService.get })
}

function useOnState() {
  const qc = useQueryClient()
  return (state: PersonalLinkState) => {
    qc.setQueryData(KEY, state)
    // storeMode on the business profile follows the link.
    void qc.invalidateQueries({ queryKey: ownerKeys.business })
  }
}

export function useTogglePersonalLink() {
  const onState = useOnState()
  return useMutation({ mutationFn: personalLinkService.setEnabled, onSuccess: onState })
}

/** Pay for a pack: create order → Razorpay Checkout → server verifies → days added. */
export function useBuyPersonalLinkPack() {
  const onState = useOnState()
  const [activePack, setActivePack] = useState<PersonalLinkPackKey | null>(null)

  const mutation = useMutation<PersonalLinkState, Error, PersonalLinkPackKey>({
    mutationFn: async (pack) => {
      setActivePack(pack)
      const [Razorpay, session] = await Promise.all([loadRazorpay(), personalLinkService.checkout(pack)])
      await waitForPageInteractive()

      let settled = false
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
            settled = true
            resolve(result)
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              if (settled) return
              settled = true
              reject(new CheckoutCancelled())
            },
          },
        })
        checkout.on('payment.failed', (failure) => {
          settled = true
          void personalLinkService.reportFailure(
            failure.error?.metadata?.order_id ?? session.orderId,
            failure.error?.code,
            failure.error?.description,
          )
          reject(new Error(failure.error?.description ?? 'The payment could not be completed.'))
        })
        checkout.open()
      })

      return personalLinkService.verify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      })
    },
    onSuccess: onState,
    onSettled: () => setActivePack(null),
  })

  return { buy: mutation.mutate, isPending: mutation.isPending, activePack }
}
