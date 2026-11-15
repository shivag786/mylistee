import { Link } from 'react-router-dom'
import { Store, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ROUTES } from '@/constants/routes'
import { formatRelative } from '@/utils/format'
import type { RecentBusiness, RecentCustomer } from '@/features/admin/onboardingTypes'

const VIA: Record<string, string> = { google: 'Google', phone: 'Mobile', pin: 'Mobile', email: 'Email' }

/** The newest customers and shops, side by side on the admin dashboard. */
export function RecentOnboarding({
  customers,
  businesses,
}: {
  customers: RecentCustomer[]
  businesses: RecentBusiness[]
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card elevation="soft" padding="none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-2 text-body-lg font-semibold text-foreground">
            <UserPlus className="size-5 text-primary" aria-hidden /> New customers
          </h2>
          <Link to={ROUTES.admin.customers} className="text-caption font-medium text-primary">
            View all
          </Link>
        </div>
        {customers.length === 0 ? (
          <p className="px-4 py-6 text-center text-caption text-text-muted">No customers yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={c.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-semibold text-foreground">{c.name}</p>
                  <p className="truncate text-small text-text-muted">
                    {c.phone ?? c.email ?? '—'}
                    {c.firstShop && <> · via <span className="font-medium text-text-secondary">{c.firstShop.name}</span></>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone={c.orders > 0 ? 'success' : 'neutral'} size="sm">
                    {c.orders > 0 ? `${c.orders} order${c.orders === 1 ? '' : 's'}` : VIA[c.via] ?? c.via}
                  </Badge>
                  {c.joinedAt && <p className="pt-0.5 text-[11px] text-text-muted">{formatRelative(c.joinedAt)}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card elevation="soft" padding="none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-2 text-body-lg font-semibold text-foreground">
            <Store className="size-5 text-primary" aria-hidden /> New shops
          </h2>
          <Link to={ROUTES.admin.businesses} className="text-caption font-medium text-primary">
            View all
          </Link>
        </div>
        {businesses.length === 0 ? (
          <p className="px-4 py-6 text-center text-caption text-text-muted">No shops yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {businesses.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Store className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-semibold text-foreground">{b.name}</p>
                  <p className="truncate text-small text-text-muted">
                    {[b.owner, b.ownerPhone, b.city, b.category].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    tone={b.status === 'active' ? 'success' : b.status === 'pending' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {b.plan ?? b.status}
                  </Badge>
                  {b.joinedAt && <p className="pt-0.5 text-[11px] text-text-muted">{formatRelative(b.joinedAt)}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
