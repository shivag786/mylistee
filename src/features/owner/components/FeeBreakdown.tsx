import { Wallet } from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'

const round = (n: number) => Math.round(n * 100) / 100
const rupees = (n: number) => `₹${round(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/**
 * What the shop keeps from one sale at `price`. Shops are on a subscription, so
 * Listee takes nothing per order: cash keeps the full price, and an online
 * payment only loses the payment gateway's fee (admin-set percent). Shown under
 * the price while adding a product, so the owner prices with it in mind.
 */
export function FeeBreakdown({ price, note }: { price: number; note?: string }) {
  const { data: config } = useAppConfig()
  const gatewayPercent = config?.payments?.gatewayFeePercent
  if (!(price > 0) || gatewayPercent == null) return null

  const fee = (price * gatewayPercent) / 100

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface text-small">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3 py-2 font-semibold text-foreground">
        <Wallet className="size-3.5 text-success" aria-hidden />
        Your earning per item
      </div>
      <Row label="Customer pays" value={rupees(price)} />
      <Row label="Paid in cash / at counter" value={`${rupees(price)} · no fee`} tone="text-success" />
      <Row label={`Paid online · ${round(gatewayPercent)}% payment gateway fee`} value={`− ${rupees(fee)}`} tone="text-danger" />
      <div className="flex items-center justify-between border-t border-border bg-success-soft/60 px-3 py-2 font-bold">
        <span className="text-foreground">You get online</span>
        <span className="tabular-nums text-success">{rupees(price - fee)}</span>
      </div>
      <p className="border-t border-border px-3 py-1.5 text-[11px] text-text-muted">
        No Listee commission — you're on a subscription. The fee is only what the payment gateway charges.
        {note && ` ${note}`}
      </p>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5 first:border-t-0">
      <span className="text-text-secondary">{label}</span>
      <span className={`shrink-0 tabular-nums ${tone ?? 'text-foreground'}`}>{value}</span>
    </div>
  )
}
