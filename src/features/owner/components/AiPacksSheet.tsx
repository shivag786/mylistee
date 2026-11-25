import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { loadRazorpay, waitForPageInteractive, type RazorpayHandlerResponse } from '@/features/payments/razorpay'
import { toast } from '@/utils/toast'
import { aiCoachService, type AiPack } from '../services/aiCoachService'

const AI_CREDITS_KEY = ['owner', 'ai-credits'] as const

/**
 * Buy extra AI answers (Razorpay). Bought answers are used after the month's
 * plan answers and never expire. The server verifies the payment; the
 * browser only carries Checkout's signed response back.
 */
export function AiPacksSheet({
  open,
  onOpenChange,
  onBought,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBought?: () => void
}) {
  const qc = useQueryClient()
  const [buying, setBuying] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: AI_CREDITS_KEY,
    queryFn: () => aiCoachService.credits(),
    enabled: open,
  })

  async function buy(pack: AiPack) {
    setBuying(pack.id)
    try {
      const [Razorpay, session] = await Promise.all([loadRazorpay(), aiCoachService.checkoutPack(pack.id)])
      await waitForPageInteractive()
      const res = await new Promise<RazorpayHandlerResponse | null>((resolve, reject) => {
        let done = false
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
          handler: (r) => {
            done = true
            resolve(r)
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              if (!done) resolve(null)
            },
          },
        })
        checkout.on('payment.failed', (f) => {
          done = true
          reject(new Error(f.error?.description ?? 'The payment could not be completed.'))
        })
        checkout.open()
      })
      if (!res) return
      const out = await aiCoachService.verifyPack({
        razorpayOrderId: res.razorpay_order_id,
        razorpayPaymentId: res.razorpay_payment_id,
        razorpaySignature: res.razorpay_signature,
      })
      toast.success(`${pack.answers} AI answers added`)
      void qc.invalidateQueries({ queryKey: AI_CREDITS_KEY })
      void qc.invalidateQueries({ queryKey: ['owner', 'ai-coach'] })
      if (out.credits >= 0) onBought?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete the payment.')
    } finally {
      setBuying(null)
    }
  }

  const u = data?.usage

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <div className="space-y-1 border-b border-border px-5 py-4 pr-12">
          <SheetTitle className="flex items-center gap-2 text-body font-bold">
            <Sparkles className="size-5 text-[#6D28D9]" aria-hidden /> More AI answers
          </SheetTitle>
          <p className="text-small text-text-secondary">
            Bought answers are used after your plan’s answers run out, and they never expire.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Spinner size={28} label="Loading AI packs" />
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            {u && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Plan answers" value={u.planLimit === null ? 'Unlimited' : `${Math.max(0, u.planLimit - u.planUsed)} left`} />
                <Stat label="Bought answers" value={`${u.credits} left`} />
                <Stat label="Used this month" value={String(u.used)} />
              </div>
            )}

            {!data.inPlan ? (
              <p className="rounded-xl bg-surface-muted p-4 text-caption text-text-secondary">
                The AI assistant is not in your plan. Choose a plan with it first, then you can add more answers here.
              </p>
            ) : data.packs.length === 0 ? (
              <p className="rounded-xl bg-surface-muted p-4 text-caption text-text-secondary">
                No AI packs are on sale right now. Your answers refresh on the 1st of every month.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.packs.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-caption font-semibold text-foreground">{p.name}</p>
                      <p className="text-small text-text-secondary">
                        {p.answers} AI answers{p.perAnswer !== null && ` · ₹${p.perAnswer} each`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void buy(p)}
                      isLoading={buying === p.id}
                      disabled={!data.paymentsLive || (buying !== null && buying !== p.id)}
                    >
                      ₹{p.price}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!data.paymentsLive && data.packs.length > 0 && (
              <p className="text-small text-text-muted">Online payment is not available right now. Please try later.</p>
            )}

            {data.purchases.length > 0 && (
              <div className="space-y-2">
                <p className="text-caption font-semibold text-foreground">Bought before</p>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {data.purchases.map((x) => (
                    <li key={x.id} className="flex justify-between gap-2 px-3 py-2 text-small">
                      <span className="text-foreground">
                        {x.pack} · {x.answers} answers
                      </span>
                      <span className="text-text-secondary">
                        ₹{x.amount}
                        {x.paidAt && ` · ${new Date(x.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-3">
      <p className="text-caption font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-text-secondary">{label}</p>
    </div>
  )
}
