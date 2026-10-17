import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GRANT_SOURCE_LABEL, type PersonalLinkGrant } from '../personalLink'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const STATUS: Record<PersonalLinkGrant['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'Added', tone: 'success' },
  pending: { label: 'Awaiting payment', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

/**
 * Package history: what was added, how (trial / online / Listee / link), the
 * amount, and the expiry before → after — so "bought with 10 days left" reads
 * plainly as "24 Oct → 23 Nov".
 */
export function PersonalLinkHistory({
  items,
  actions,
}: {
  items: PersonalLinkGrant[]
  /** Extra controls per row (admin: check payment / cancel link). */
  actions?: (grant: PersonalLinkGrant) => ReactNode
}) {
  if (items.length === 0) {
    return <p className="text-small text-text-muted">No packages yet.</p>
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((g) => (
        <li key={g.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
          <div className="min-w-0">
            <p className="text-caption font-semibold text-foreground">
              {g.days} days · {GRANT_SOURCE_LABEL[g.source]}
              {g.amount > 0 && <span className="font-normal text-text-secondary"> · ₹{g.amount}</span>}
            </p>
            {g.status === 'active' ? (
              <p className="inline-flex items-center gap-1 text-small text-text-secondary">
                {g.expiresBefore && new Date(g.expiresBefore) > new Date(g.appliedAt ?? 0)
                  ? fmtDate(g.expiresBefore)
                  : 'Started ' + fmtDate(g.appliedAt)}
                <ArrowRight className="size-3" aria-hidden />
                <span className="font-medium text-foreground">{fmtDate(g.expiresAfter)}</span>
              </p>
            ) : (
              <p className="text-small text-text-muted">Created {fmtDate(g.createdAt)}</p>
            )}
            {(g.note || g.grantedBy) && (
              <p className="truncate text-small text-text-muted">
                {[g.note, g.grantedBy && `by ${g.grantedBy}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS[g.status].tone}>{STATUS[g.status].label}</Badge>
            {actions?.(g)}
          </div>
        </li>
      ))}
    </ul>
  )
}
