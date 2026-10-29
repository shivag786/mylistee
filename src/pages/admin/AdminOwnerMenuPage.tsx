import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Coins, Gift, PanelLeft, Ticket } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useFeatureFlags, useSetFeatureFlag } from '@/features/admin/hooks/useAdmin'

/** Admin-facing name is seeded as "Owner menu: <module>" — show just the module. */
function moduleName(name: string): string {
  return name.replace(/^Owner menu:\s*/i, '')
}

/**
 * Owner menu control — turn owner-app pages/services on or off for every business
 * owner. Off ⇒ the item disappears from the owner's sidebar + bottom nav and the
 * route is blocked. Backed by the `owner_*` feature flags.
 */
export function AdminOwnerMenuPage() {
  const { data, isLoading, isError, refetch } = useFeatureFlags()
  const setFlag = useSetFeatureFlag()

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading owner menu" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const modules = data.filter((f) => f.key.startsWith('owner_'))
  const rewards = data.find((f) => f.key === 'owner_rewards')
  const coins = data.find((f) => f.key === 'owner_loyalty')

  function toggle(key: string, enabled: boolean) {
    setFlag
      .mutateAsync({ key, enabled })
      .then(() => toast.success(enabled ? 'Module enabled for owners' : 'Module hidden from owners'))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not update the module.'))
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Owner menu</h1>
        <p className="text-caption text-text-secondary">
          Choose which pages &amp; services appear in the business-owner app. Dashboard, Business
          profile and Plan &amp; billing are always available.
        </p>
      </header>

      {(rewards || coins) && (
        <Card elevation="soft" padding="md" className="space-y-1">
          <p className="flex items-center gap-2 text-body font-bold text-foreground">
            <Gift className="size-5 text-primary" aria-hidden /> Rewards &amp; loyalty
          </p>
          <p className="text-caption text-text-secondary">
            Two separate systems. Each switch turns the feature off for shops <em>and</em> customers.
          </p>
          <ul className="divide-y divide-border pt-2">
            {[
              {
                flag: rewards,
                icon: <Ticket className="size-5" aria-hidden />,
                title: 'Rewards & coupons',
                text: 'Bill discount, come-back coupon, loyalty-step scratch cards and coupon codes. Off: nothing applies at checkout or shows on shop pages.',
              },
              {
                flag: coins,
                icon: <Coins className="size-5" aria-hidden />,
                title: 'Loyalty coins',
                text: 'Listee coins customers earn on orders and spend at shops. Off: no new coins are earned or advertised; customers can still use coins they already have.',
              },
            ].map(({ flag, icon, title, text }) =>
              flag ? (
                <li key={flag.key} className="flex items-center gap-3 py-3">
                  <span className={flag.enabled ? 'text-primary' : 'text-text-muted'}>{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="text-caption text-text-secondary">{text}</p>
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={(v) => toggle(flag.key, v)} aria-label={`Toggle ${title}`} />
                </li>
              ) : null,
            )}
          </ul>
        </Card>
      )}

      {modules.length === 0 ? (
        <EmptyState
          icon={<PanelLeft className="size-7" />}
          title="No modules found"
          description="Run the feature-flag seeder to populate the owner modules."
        />
      ) : (
        <Card elevation="soft" padding="none">
          <ul className="divide-y divide-border">
            {modules.map((flag) => (
              <li key={flag.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{moduleName(flag.name)}</p>
                  <p className="text-caption text-text-secondary">{flag.description}</p>
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(v) => toggle(flag.key, v)}
                  aria-label={`Toggle ${moduleName(flag.name)}`}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
