import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pager, StatTile, WhatsAppButton } from '@/features/admin/components/InsightBits'
import { useAdminSubscriptions, type SubscriptionRow } from '@/features/admin/insights'

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** Who pays for which plan, who lapses this week, and a one-tap WhatsApp nudge to renew. */
export function AdminSubscriptionsPage() {
  const [status, setStatus] = useState('active')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useAdminSubscriptions({ status, search, page })
  const s = data?.summary

  const pick = (v: string) => {
    setStatus(v)
    setPage(1)
  }

  const columns: Column<SubscriptionRow>[] = [
    {
      key: 'shop',
      label: 'Shop',
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.shop ?? '—'}</p>
          <p className="text-small text-text-muted">{r.owner ?? ''} {r.phone ? `· ${r.phone}` : ''}</p>
        </div>
      ),
    },
    { key: 'plan', label: 'Plan', cell: (r) => <span>{r.plan ?? '—'} <span className="text-text-muted">· ₹{r.price.toLocaleString('en-IN')}/{r.interval}</span></span> },
    { key: 'start', label: 'Started', className: 'whitespace-nowrap', cell: (r) => fmt(r.startsAt) },
    { key: 'end', label: 'Ends', className: 'whitespace-nowrap', cell: (r) => fmt(r.endsAt) },
    {
      key: 'left',
      label: 'Days left',
      cell: (r) =>
        r.daysLeft === null ? (
          <Badge tone="neutral">No end</Badge>
        ) : r.daysLeft < 0 ? (
          <Badge tone="danger">Expired {Math.abs(r.daysLeft)}d ago</Badge>
        ) : (
          <Badge tone={r.daysLeft <= 7 ? 'warning' : 'success'}>{r.daysLeft} days</Badge>
        ),
    },
    { key: 'renew', label: 'Auto-renew', cell: (r) => (r.autoRenew ? 'On' : 'Off') },
    {
      key: 'nudge',
      label: '',
      cell: (r) => (
        <WhatsAppButton
          phone={r.phone}
          text={
            r.daysLeft !== null && r.daysLeft < 0
              ? `Hi ${r.owner ?? ''}, your Listee ${r.plan ?? ''} plan for ${r.shop ?? 'your shop'} has ended. Renew now so your customers keep getting offers and rewards.`
              : `Hi ${r.owner ?? ''}, your Listee ${r.plan ?? ''} plan for ${r.shop ?? 'your shop'} ends on ${fmt(r.endsAt)}. Renew in the Listee Business app to keep everything running.`
          }
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Subscriptions</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Active paid" value={s?.active ?? '…'} active={status === 'active'} onClick={() => pick('active')} />
        <StatTile label="Ending in 7 days" value={s?.expiringWeek ?? '…'} tone="text-warning" active={status === 'expiring'} onClick={() => pick('expiring')} />
        <StatTile label="Expired (30 days)" value={s?.expiredMonth ?? '…'} tone="text-destructive" active={status === 'expired'} onClick={() => pick('expired')} />
        <StatTile label="Shops on free" value={s?.freeShops ?? '…'} />
      </div>

      <AdminToolbar
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        placeholder="Search shop…"
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'expiring', label: 'Ending in 7 days' },
          { value: 'expired', label: 'Expired' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'all', label: 'All' },
        ]}
        status={status}
        onStatus={(v) => pick(v || 'active')}
      />

      <AdminTable columns={columns} rows={data?.items ?? []} getRowKey={(r) => r.id} isLoading={isLoading} emptyMessage="No subscriptions here." />
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  )
}
