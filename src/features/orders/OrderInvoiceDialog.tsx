import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import type { Order } from '@/features/owner/orderTypes'
import { customerOrderService } from './customerOrderService'

const money = (n: number) => `₹${(Math.round(n * 100) / 100).toFixed(2)}`

/**
 * The bill as the shop issued it. For a GST shop this is a proper tax invoice:
 * seller's legal name, GSTIN, address, place of supply, invoice number, each
 * line's rate, taxable value, CGST/SGST and the rate-wise GST summary.
 *
 * The list card carries no seller details (that would cost a query per order),
 * so the dialog loads the single order when it opens.
 */
export function OrderInvoiceDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', 'order', order.id],
    queryFn: () => customerOrderService.get(order.id),
    enabled: open,
    staleTime: 60_000,
  })
  const bill = data ?? order
  const paper = useRef<HTMLDivElement>(null)

  function print() {
    const html = paper.current?.innerHTML
    if (!html) return
    const w = window.open('', '_blank', 'width=420,height=720')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${bill.invoiceNo ?? bill.token}</title>
<style>
  body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:16px;max-width:380px}
  h2{font-size:16px;margin:0 0 2px;text-align:center} p{margin:0} .c{text-align:center}
  .muted{color:#555;font-size:12px} .row{display:flex;justify-content:space-between;gap:8px}
  .b{font-weight:700} hr{border:0;border-top:1px dashed #999;margin:8px 0}
  table{width:100%;border-collapse:collapse;font-size:12px} th,td{padding:2px 0;text-align:right} th:first-child,td:first-child{text-align:left}
  .big{font-size:16px}
</style></head><body>${html}</body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bill.seller?.isTaxInvoice ? 'Tax invoice' : 'Bill'}</DialogTitle>
        </DialogHeader>

        {isLoading && !data ? (
          <div className="flex justify-center py-10">
            <Spinner size={28} label="Loading bill" />
          </div>
        ) : (
          <div ref={paper} className="space-y-2 rounded-xl border border-border bg-surface p-4 text-caption text-foreground">
            <InvoiceBody order={bill} />
          </div>
        )}

        <Button variant="outline" fullWidth leftIcon={<Printer className="size-4" />} onClick={print} disabled={isLoading && !data}>
          Print / save as PDF
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`row flex justify-between gap-2 ${strong ? 'b text-body font-bold' : 'text-text-secondary'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function InvoiceBody({ order }: { order: Order }) {
  const s = order.seller
  const tax = order.tax
  const when = new Date(order.paidAt ?? order.createdAt ?? order.placedAt ?? Date.now())
  const discount = (order.billDiscount ?? 0) + (order.couponDiscount ?? 0) + (order.manualDiscount ?? 0) + order.coinDiscount

  return (
    <>
      <div className="c space-y-0.5 text-center">
        <h2 className="text-body-lg font-extrabold">{s?.legalName ?? order.businessName}</h2>
        {s && s.legalName !== s.name && <p className="muted text-small text-text-muted">{s.name}</p>}
        {s?.address && <p className="muted text-small text-text-muted">{s.address}</p>}
        {s?.phone && <p className="muted text-small text-text-muted">Ph: {s.phone}</p>}
        {s?.gstin && <p className="b font-semibold">GSTIN: {s.gstin}</p>}
        {s?.fssai && <p className="muted text-small text-text-muted">FSSAI: {s.fssai}</p>}
        <p className="b pt-1 font-bold uppercase tracking-wide">{s?.isTaxInvoice ? 'Tax invoice' : 'Bill'}</p>
      </div>
      <hr className="border-dashed border-border" />

      <div className="space-y-0.5">
        {order.invoiceNo && <Row label="Invoice no." value={order.invoiceNo} />}
        <Row label="Order" value={`${order.token}${order.serial ? ` · No. ${order.serial}` : ''}`} />
        <Row
          label="Date"
          value={when.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        />
        <Row label="Service" value={order.tableLabel ? `${order.serviceLabel} · Table ${order.tableLabel}` : order.serviceLabel} />
        {s?.placeOfSupply && <Row label="Place of supply" value={s.placeOfSupply} />}
        {s?.isTaxInvoice && <Row label="SAC" value={s.sac} />}
      </div>
      <hr className="border-dashed border-border" />

      <table className="w-full text-small">
        <thead>
          <tr className="text-text-muted">
            <th className="text-left font-medium">Item</th>
            <th className="text-right font-medium">Qty</th>
            {tax && <th className="text-right font-medium">GST</th>}
            <th className="text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, k) => (
            <tr key={k}>
              <td className="py-0.5 pr-2">
                {i.name}
                {i.addons && i.addons.length > 0 && <span className="block text-text-muted">+ {i.addons.join(', ')}</span>}
              </td>
              <td className="text-right tabular-nums">{i.quantity}</td>
              {tax && <td className="text-right tabular-nums">{i.taxRate != null ? `${i.taxRate}%` : '—'}</td>}
              <td className="text-right tabular-nums">{money(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="border-dashed border-border" />

      <div className="space-y-0.5">
        <Row label="Item total" value={money(order.subtotal)} />
        {discount > 0 && <Row label="Discount" value={`−${money(discount)}`} />}
        {order.deliveryFee > 0 && <Row label="Delivery fee" value={money(order.deliveryFee)} />}
        {tax && tax.serviceCharge > 0 && <Row label={`Service charge (${tax.serviceChargePercent}%)`} value={money(tax.serviceCharge)} />}
        {tax && tax.cgst + tax.sgst > 0 && (
          <>
            <Row label="Taxable value" value={money(tax.taxable)} />
            <Row label={tax.mode === 'inclusive' ? 'CGST (incl.)' : 'CGST'} value={money(tax.cgst)} />
            <Row label={tax.mode === 'inclusive' ? 'SGST (incl.)' : 'SGST'} value={money(tax.sgst)} />
          </>
        )}
        {tax && tax.roundOff !== 0 && <Row label="Round off" value={`${tax.roundOff < 0 ? '−' : ''}${money(Math.abs(tax.roundOff))}`} />}
        <hr className="border-dashed border-border" />
        <Row label="Total" value={money(order.total)} strong />
        {order.paymentLabel && <Row label="Paid by" value={order.paymentLabel} />}
      </div>

      {tax?.rates && tax.rates.length > 0 && tax.cgst + tax.sgst > 0 && (
        <>
          <hr className="border-dashed border-border" />
          <p className="b font-semibold">GST summary</p>
          <table className="w-full text-small">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left font-medium">Rate</th>
                <th className="text-right font-medium">Taxable</th>
                <th className="text-right font-medium">CGST</th>
                <th className="text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {tax.rates.map((r) => (
                <tr key={r.rate}>
                  <td>{r.rate}%</td>
                  <td className="text-right tabular-nums">{money(r.taxable)}</td>
                  <td className="text-right tabular-nums">{money(r.tax / 2)}</td>
                  <td className="text-right tabular-nums">{money(r.tax / 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {s?.footer && (
        <>
          <hr className="border-dashed border-border" />
          <p className="c muted text-center text-small text-text-muted">{s.footer}</p>
        </>
      )}
    </>
  )
}
