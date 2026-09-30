import { useState } from 'react'
import { RotateCcw, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { useAdminPayments, useRefundPayment } from '@/features/admin/hooks/useAdmin'
import type { AdminPayment, PaymentFilters, PaymentStatus } from '@/features/admin/types'
import { formatPrice } from '@/features/owner/planDisplay'

/**
 * Gateway payments and refunds — the operator side of the published Refund
 * Policy. Every attempt is listed, including abandoned and failed ones, because
 * "I paid and nothing happened" is answered by the rows that never reached
 * `captured`.
 *
 * Refunds are irreversible and audited, so this screen asks for a reason and
 * makes the amount explicit rather than offering a one-tap refund.
 */
const STATUS_OPTIONS = [
  { value: 'captured', label: 'Captured' },
  { value: 'created', label: 'Started' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const KIND_OPTIONS = [
  { value: 'plan', label: 'Plan payments' },
  { value: 'order', label: 'Order payments' },
]

const STATUS_TONE: Record<PaymentStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  captured: 'success',
  authorized: 'warning',
  created: 'neutral',
  failed: 'danger',
  refunded: 'warning',
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  captured: 'Paid',
  authorized: 'Authorised',
  created: 'Started',
  failed: 'Failed',
  refunded: 'Refunded',
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1 })
  const { data, isLoading, isFetching } = useAdminPayments(filters)
  const [refunding, setRefunding] = useState<AdminPayment | null>(null)

  const columns: Column<AdminPayment>[] = [
    {
      key: 'business',
      label: 'For',
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{p.businessName ?? '—'}</p>
          {/* Plans and orders share this table -- say which one this row is. */}
          <p className="truncate text-small text-text-muted">
            {p.kind === 'order'
              ? `Order ${p.orderToken ?? ''}${p.customerName ? ` · ${p.customerName}` : ''}`
              : `Plan · ${p.planName ?? '—'}`}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'tabular-nums',
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{formatPrice(p.amount, p.currency)}</p>
          {p.refundedAmount > 0 && (
            <p className="text-small text-warning-foreground">
              −{formatPrice(p.refundedAmount, p.currency)} refunded
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      cell: (p) => (
        <div className="min-w-0">
          <Badge tone={STATUS_TONE[p.status]} size="sm">
            {STATUS_LABEL[p.status]}
          </Badge>
          {p.status === 'failed' && p.errorDescription && (
            <p className="mt-0.5 truncate text-small text-text-muted">{p.errorDescription}</p>
          )}
          {p.method && p.status === 'captured' && (
            <p className="mt-0.5 text-small uppercase text-text-muted">{p.method}</p>
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      cell: (p) => (
        <div className="min-w-0 font-mono text-small text-text-muted">
          <p className="truncate">{p.paymentId ?? p.orderId}</p>
          {p.invoiceNumber && <p className="truncate">{p.invoiceNumber}</p>}
        </div>
      ),
    },
    {
      key: 'when',
      label: 'When',
      className: 'tabular-nums',
      cell: (p) => fmtDateTime(p.paidAt ?? p.failedAt ?? p.createdAt),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (p) =>
        p.refundableAmount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Undo2 className="size-4" />}
            onClick={() => setRefunding(p)}
          >
            Refund
          </Button>
        ) : null,
    },
  ]

  const totals = data?.meta

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Payments</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">
        Razorpay payments for plans and for customer orders, including attempts that never
        completed. Refunding an order payment in full also cancels the order, if it has not been
        handed over yet. Refunds follow the published Refund &amp; Cancellation Policy and are
        written to the audit log.
      </p>

      {totals && (
        // Two sets of figures, never added together: plan payments are the
        // platform's revenue, order payments were taken for shops and are owed
        // to them.
        <div className="grid gap-2 text-caption sm:grid-cols-2">
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="font-medium text-foreground">Plan revenue</p>
            <p className="text-text-secondary">
              Captured <span className="font-semibold text-foreground">{formatPrice(totals.capturedTotal)}</span>
              {' · '}Refunded <span className="font-semibold text-foreground">{formatPrice(totals.refundedTotal)}</span>
            </p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="font-medium text-foreground">Order payments (owed to shops)</p>
            <p className="text-text-secondary">
              Captured{' '}
              <span className="font-semibold text-foreground">{formatPrice(totals.orderCapturedTotal ?? 0)}</span>
              {' · '}Refunded{' '}
              <span className="font-semibold text-foreground">{formatPrice(totals.orderRefundedTotal ?? 0)}</span>
            </p>
          </div>
        </div>
      )}

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search business, order token or Razorpay id…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
        filters={[
          {
            label: 'Filter by kind',
            allLabel: 'Plans and orders',
            value: filters.kind,
            options: KIND_OPTIONS,
            onChange: (kind) =>
              setFilters((f) => ({ ...f, kind: (kind || undefined) as 'plan' | 'order' | undefined, page: 1 })),
          },
        ]}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No payments match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}

      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} />
    </div>
  )
}

/**
 * Refund one payment. Defaults to the full refundable amount — the common case
 * — but allows a smaller figure for a goodwill adjustment, which leaves the
 * plan running.
 */
function RefundDialog({ payment, onClose }: { payment: AdminPayment | null; onClose: () => void }) {
  const refund = useRefundPayment()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  if (!payment) return null

  const max = payment.refundableAmount
  const parsed = amount.trim() === '' ? max : Number(amount)
  const isFull = Math.abs(parsed - max) < 0.01
  const invalid = Number.isNaN(parsed) || parsed <= 0 || parsed > max

  function submit() {
    if (invalid || !payment) return
    refund.mutate(
      { id: payment.id, amount: isFull ? undefined : parsed, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Refunded ${formatPrice(parsed, payment.currency)}.`)
          setAmount('')
          setReason('')
          onClose()
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'The refund could not be issued.'),
      },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payment.kind === 'order'
              ? `Refund order ${payment.orderToken ?? ''}`
              : `Refund ${payment.businessName ?? 'this payment'}`}
          </DialogTitle>
          <DialogDescription>
            Up to {formatPrice(max, payment.currency)} can be sent back to the original payment
            method.{' '}
            {payment.kind === 'order'
              ? 'A full refund also cancels the order and returns its coins, unless the shop has already handed it over; a partial one leaves the order as it is.'
              : 'A full refund also ends the plan immediately; a partial one leaves it running.'}{' '}
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Amount (₹)</Label>
            <Input
              id="refund-amount"
              inputMode="decimal"
              placeholder={String(max)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-small text-text-muted">
              Leave blank to refund the full {formatPrice(max, payment.currency)}.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              rows={2}
              maxLength={200}
              placeholder="Why is this being refunded? Stored on the audit log."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={refund.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            disabled={invalid}
            isLoading={refund.isPending}
            onClick={submit}
          >
            Refund {formatPrice(invalid ? 0 : parsed, payment.currency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminPaymentsPage
