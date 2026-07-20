import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { useFeatureFlags, useSetFeatureFlag } from '@/features/admin/hooks/useAdmin'

export function AdminFeatureFlagsPage() {
  const { data, isLoading, isError, refetch } = useFeatureFlags()
  const setFlag = useSetFeatureFlag()

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading flags" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  function toggle(key: string, enabled: boolean) {
    setFlag
      .mutateAsync({ key, enabled })
      .then(() => toast.success(enabled ? 'Feature enabled' : 'Feature disabled'))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not update flag.'))
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Feature flags</h1>
        <p className="text-caption text-text-secondary">Turn features on or off without a deploy</p>
      </header>

      <Card elevation="soft" padding="none">
        <ul className="divide-y divide-border">
          {data.map((flag) => (
            <li key={flag.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{flag.name}</p>
                <p className="text-caption text-text-secondary">{flag.description}</p>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={(v) => toggle(flag.key, v)}
                aria-label={`Toggle ${flag.name}`}
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
