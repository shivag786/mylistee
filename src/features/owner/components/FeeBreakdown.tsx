import { Wallet } from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'

const round = (n: number) => Math.round(n * 100) / 100
const rupees = (n: number) => `₹${round(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/**
 * What the shop keeps from one sale at `price`: the customer's price, Listee's
 * fee in rupees (one fee, set by the admin — no percentage shown) and what is
 * left. Shown under the price while adding a product, so the owner prices with
 * it in mind.
 */
export function FeeBreakdown({ price, note }: { price: number; note?: string }) {
  const { data: config } = useAppConfig()
  const fees = config?.payments
  if (!(price > 0) || fees?.platformFeePercent == null) return null

  const fee = (price * fees.platformFeePercent) / 100

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface text-small">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3 py-2 font-semibold text-foreground">
        <Wallet className="size-3.5 text-success" aria-hidden />
        Your earning per item
      </div>
      <Row label="Customer pays" value={rupees(price)} />
      <Row label="Listee fee" value={`− ${rupees(fee)}`} tone="text-danger" />
      <div className="flex items-center justify-between border-t border-border bg-success-soft/60 px-3 py-2 font-bold">
        <span className="text-foreground">You get</span>
        <span className="tabular-nums text-success">{rupees(price - fee)}</span>
      </div>
      {note && <p className="border-t border-border px-3 py-1.5 text-[11px] text-text-muted">{note}</p>}
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 px-3 py-1.5 first:border-t-0">
      <span className="text-text-secondary">{label}</span>
      <span className={`tabular-nums ${tone ?? 'text-foreground'}`}>{value}</span>
    </div>
  )
}
