import { useState } from 'react'
import { Copy, RotateCcw, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { useAdminOrders } from '@/features/admin/hooks/useAdmin'
import type { AdminOrder, OrderFilters, OrderPaymentType, PaymentStatus } from '@/features/admin/types'
import { formatPrice } from '@/features/owner/planDisplay'

/**
 * Every customer order on the platform, with the money trail beside it.
 *
 * Built for one conversation above all: "I paid and nothing happened". So it
 * shows what the shop's queue hides -- orders still waiting on their payment,
 * and ones withdrawn after a closed window -- and lets support find an order by
 * whatever the customer has in hand: the token, their number, or the Razorpay
 * id off their bank statement.
 *
 * Refunds stay on the Payments page, where they are audited; this page shows
 * the Razorpay id to look one up there.
 */
const STATUS_OPTIONS = [
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_OPTIONS = [
  { value: 'online', label: 'Paid online' },
  { value: 'partial', label: 'Advance online' },
  { value: 'cod', label: 'Cash' },
]

const TYPE_LABEL: Record<OrderPaymentType, string> = {
  online: 'Online',
  partial: 'Advance',
  cod: 'Cash',
}

const TYPE_TONE: Record<OrderPaymentType, 'info' | 'premium' | 'neutral'> = {
  online: 'info',
  partial: 'premium',
  cod: 'neutral',
}

const ORDER_TONE: Record<string, 'success' | 'neutral' | 'warning' | 'danger' | 'info'> = {
  awaiting_payment: 'warning',
  placed: 'info',
  confirmed: 'info',
  paid: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

const PAY_LABEL: Record<PaymentStatus, string> = {
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  } catch {
    toast.error('Could not copy.')
  }
}

export function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1 })
  const { data, isLoading, isFetching } = useAdminOrders(filters)

  const columns: Column<AdminOrder>[] = [
    {
      key: 'order',
      label: 'Order',
      cell: (o) => (
        <div className="min-w-0">
          <p className="font-mono text-body font-bold tracking-widest text-foreground">{o.token}</p>
          <p className="truncate text-small text-text-muted">
            {o.businessName ?? '—'} · {o.serviceLabel}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{o.customerName ?? '—'}</p>
          <p className="truncate text-small text-text-muted">{o.customerContact ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'tabular-nums',
      cell: (o) => (
        <div>
          <p className="font-medium text-foreground">{formatPrice(o.total)}</p>
          {o.paymentType !== 'cod' && (
            <p className="text-small text-text-muted">
              {formatPrice(o.onlineAmount)} {o.paidOnline ? 'online' : 'to pay online'}
              {o.amountDue > 0 && ` · ${formatPrice(o.amountDue)} due`}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'payment',
      label: 'Payment',
      cell: (o) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={TYPE_TONE[o.paymentType]} size="sm">
            {TYPE_LABEL[o.paymentType]}
          </Badge>
          {o.payment && (
            <span className="text-small text-text-muted">
              {PAY_LABEL[o.payment.status]}
              {o.payment.method && o.payment.status === 'captured' && ` · ${o.payment.method.toUpperCase()}`}
              {o.payment.refundedAmount > 0 && ` · ${formatPrice(o.payment.refundedAmount)} refunded`}
            </span>
          )}
          {o.payment?.status === 'failed' && o.payment.errorDescription && (
            <span className="max-w-[180px] truncate text-small text-danger">{o.payment.errorDescription}</span>
          )}
        </div>
      ),
    },
    {
      key: 'razorpay',
      label: 'Razorpay',
      cell: (o) => {
        // A payment id once money moved; before that, the order id is all there is.
        const ref = o.payment?.gatewayPaymentId ?? o.payment?.gatewayOrderId
        if (!ref) return <span className="text-text-muted">—</span>
        return (
          <button
            type="button"
            onClick={() => void copy(ref)}
            className="group inline-flex max-w-[190px] items-center gap-1 font-mono text-small text-text-secondary hover:text-foreground"
            title="Copy"
          >
            <span className="truncate">{ref}</span>
            <Copy className="size-3 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
          </button>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      cell: (o) => (
        <Badge tone={ORDER_TONE[o.status] ?? 'neutral'} size="sm">
          {o.statusLabel}
        </Badge>
      ),
    },
    {
      key: 'when',
      label: 'When',
      className: 'tabular-nums',
      cell: (o) => fmtDateTime(o.placedAt ?? o.createdAt),
    },
  ]

  const awaiting = data?.meta.awaitingPayment ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Orders</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">
        Every order across shops, including ones the shops never see: still waiting on a payment,
        or withdrawn after the customer closed the payment window.
      </p>

      {awaiting > 0 && (
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, status: 'awaiting_payment', page: 1 }))}
          className="inline-flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-caption text-foreground hover:bg-warning/15"
        >
          <Clock className="size-4 text-warning-foreground" aria-hidden />
          {awaiting} {awaiting === 1 ? 'order is' : 'orders are'} waiting on a payment
        </button>
      )}

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Token, customer, mobile, shop or Razorpay id…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
        filters={[
          {
            label: 'Filter by payment',
            allLabel: 'Any payment',
            value: filters.payment,
            options: PAYMENT_OPTIONS,
            onChange: (payment) =>
              setFilters((f) => ({ ...f, payment: (payment || undefined) as OrderPaymentType | undefined, page: 1 })),
          },
        ]}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No orders match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
