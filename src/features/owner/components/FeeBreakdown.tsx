import { Wallet } from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'

const round = (n: number) => Math.round(n * 100) / 100
const rupees = (n: number) => `₹${round(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/**
 * What the shop keeps from one sale at `price`, cash vs online, line by line:
 * Listee's platform fee on both, payment charges only on online. Shown under
 * the price while adding a product, so the owner prices with it in mind.
 */
export function FeeBreakdown({ price, note }: { price: number; note?: string }) {
  const { data: config } = useAppConfig()
  const fees = config?.payments
  if (!(price > 0) || fees?.platformFeePercent == null) return null

  const platformPct = fees.platformFeePercent
  const gatewayPct = fees.gatewayFeePercent ?? 0
  const platform = (price * platformPct) / 100
  const gateway = (price * gatewayPct) / 100

  const rows: { label: string; cash: string; online: string; tone?: string }[] = [
    { label: 'Customer pays', cash: rupees(price), online: rupees(price) },
    { label: `Platform fee (${platformPct}%)`, cash: `− ${rupees(platform)}`, online: `− ${rupees(platform)}`, tone: 'text-danger' },
    { label: `Payment charges (${gatewayPct}%)`, cash: '—', online: `− ${rupees(gateway)}`, tone: 'text-danger' },
  ]

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3 py-2 text-small font-semibold text-foreground">
        <Wallet className="size-3.5 text-success" aria-hidden />
        Your earning per item
      </div>
      <table className="w-full text-small">
        <thead>
          <tr className="text-text-muted">
            <th className="px-3 py-1.5 text-left font-medium" />
            <th className="px-3 py-1.5 text-right font-medium">Cash</th>
            <th className="px-3 py-1.5 text-right font-medium">Online</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border/60">
              <td className="px-3 py-1.5 text-text-secondary">{r.label}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${r.cash === '—' ? 'text-text-muted' : r.tone ?? 'text-foreground'}`}>{r.cash}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${r.tone ?? 'text-foreground'}`}>{r.online}</td>
            </tr>
          ))}
          <tr className="border-t border-border bg-success-soft/60 font-bold">
            <td className="px-3 py-2 text-foreground">You get</td>
            <td className="px-3 py-2 text-right tabular-nums text-success">{rupees(price - platform)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-success">{rupees(price - platform - gateway)}</td>
          </tr>
        </tbody>
      </table>
      {note && <p className="border-t border-border px-3 py-1.5 text-[11px] text-text-muted">{note}</p>}
    </div>
  )
}
