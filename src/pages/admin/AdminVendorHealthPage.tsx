import { useState } from 'react'
import { Printer, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pager, StatTile, WhatsAppButton } from '@/features/admin/components/InsightBits'
import { useVendorHealth, type HealthRow } from '@/features/admin/insights'
import { ROUTES } from '@/constants/routes'

/** What to tell the owner for each missing piece. */
const TIPS: Record<string, string> = {
  no_logo: 'add your shop logo',
  no_products: 'add your menu / products with photos',
  no_offer: 'start one offer (customers look for deals)',
  no_location: 'set your shop location on the map so nearby customers find you',
  no_app: 'install the Listee Business app to get order alerts',
  no_scans: 'put your Listee QR poster at the counter',
  no_orders: 'share your shop link with customers',
}

/** Active shops ranked by what they are missing, with a ready WhatsApp nudge. */
export function AdminVendorHealthPage() {
  const [issue, setIssue] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useVendorHealth({ issue, search, page })

  const columns: Column<HealthRow>[] = [
    {
      key: 'shop',
      label: 'Shop',
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-small text-text-muted">{[r.category, r.city, r.owner, r.phone].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    {
      key: 'score',
      label: 'Health',
      cell: (r) => <Badge tone={r.score >= 80 ? 'success' : r.score >= 50 ? 'warning' : 'danger'}>{r.score}%</Badge>,
    },
    {
      key: 'issues',
      label: 'Missing',
      className: 'min-w-[260px]',
      cell: (r) =>
        r.issues.length === 0 ? (
          <span className="text-success">All good</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.issues.map((i) => (
              <Badge key={i.key} tone="neutral">{i.label}</Badge>
            ))}
          </div>
        ),
    },
    {
      key: 'act',
      label: '',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.issues.length > 0 && (
            <WhatsAppButton
              phone={r.phone}
              text={`Hi ${r.owner ?? ''}, quick tips to get more customers for ${r.name} on Listee: ${r.issues
                .map((i) => TIPS[i.key])
                .filter(Boolean)
                .map((t, n) => `${n + 1}) ${t}`)
                .join(' ')}. Need help? Just reply here.`}
            />
          )}
          {r.issues.some((i) => i.key === 'no_scans') && (
            <a href={ROUTES.admin.businessPoster(r.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-small text-text-secondary hover:text-foreground">
              <Printer className="size-3.5" /> Poster
            </a>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Vendor health</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">
        {data?.total ?? '…'} active shops. Tap a problem to see who has it, then nudge them on WhatsApp.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(data?.issues ?? []).map((i) => (
          <StatTile
            key={i.key}
            label={i.label}
            value={i.count}
            tone={i.count > 0 ? 'text-warning' : 'text-success'}
            active={issue === i.key}
            onClick={() => {
              setIssue(issue === i.key ? undefined : i.key)
              setPage(1)
            }}
          />
        ))}
      </div>

      <AdminToolbar
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        placeholder="Search shop…"
      />
      <AdminTable columns={columns} rows={data?.items ?? []} getRowKey={(r) => r.id} isLoading={isLoading} emptyMessage="No shops match." />
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  )
}
