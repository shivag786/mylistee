import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { IconButton } from '@/components/ui/icon-button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { toast } from '@/utils/toast'
import { BannerFormSheet } from '@/features/admin/components/BannerFormSheet'
import { useAdminBanners, useBannerActions } from '@/features/admin/hooks/useAdmin'
import type { AdminBanner, BannerPlacement } from '@/features/admin/types'

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'home_top', label: 'Top of home' },
  { value: 'home_after_combos', label: 'After combos' },
]

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
}

export function AdminBannersPage() {
  const { data, isLoading, isError, refetch } = useAdminBanners()
  const { toggle, remove, reorder } = useBannerActions()
  const [editing, setEditing] = useState<AdminBanner | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AdminBanner | null>(null)

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading banners" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  function move(group: AdminBanner[], index: number, dir: -1 | 1) {
    const next = [...group]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorder.mutate(next.map((b) => b.id), {
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not reorder.'),
    })
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Home banners</h1>
          <p className="text-caption text-text-secondary">
            Advertisements shown on the home page. Multiple banners in a slot rotate automatically.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          New banner
        </Button>
      </header>

      {data.length === 0 && (
        <EmptyState title="No banners yet" description="Create your first home-page banner." actionLabel="New banner" onAction={() => setCreating(true)} />
      )}

      {PLACEMENTS.map(({ value, label }) => {
        const group = data.filter((b) => b.placement === value).sort((a, b) => a.position - b.position)
        if (group.length === 0) return null
        return (
          <section key={value} className="space-y-3">
            <h2 className="text-subtitle font-semibold text-foreground">{label}</h2>
            <div className="space-y-3">
              {group.map((banner, i) => (
                <Card key={banner.id} padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="aspect-[16/6] w-full shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:w-48">
                    {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} loading="lazy" className="size-full object-cover" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">{banner.title}</p>
                      {banner.isLive ? <Badge tone="success" size="sm">Live</Badge> : <Badge tone="neutral" size="sm">Off</Badge>}
                      {banner.linkUrl && (
                        <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-small text-primary">
                          link <ExternalLink className="size-3" aria-hidden />
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 text-small text-text-muted">
                      {fmt(banner.startsAt)} → {fmt(banner.endsAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="mr-1 flex flex-col">
                      <IconButton size="sm" aria-label="Move up" disabled={i === 0 || reorder.isPending} onClick={() => move(group, i, -1)}>
                        <ArrowUp className="size-4" aria-hidden />
                      </IconButton>
                      <IconButton size="sm" aria-label="Move down" disabled={i === group.length - 1 || reorder.isPending} onClick={() => move(group, i, 1)}>
                        <ArrowDown className="size-4" aria-hidden />
                      </IconButton>
                    </div>
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() =>
                        toggle.mutate(banner.id, { onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed.') })
                      }
                      aria-label={`${banner.isActive ? 'Disable' : 'Enable'} ${banner.title}`}
                    />
                    <IconButton aria-label="Edit" onClick={() => setEditing(banner)}>
                      <Pencil className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton aria-label="Delete" onClick={() => setDeleting(banner)}>
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </IconButton>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )
      })}

      <BannerFormSheet open={creating} onOpenChange={setCreating} banner={null} />
      <BannerFormSheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} banner={editing} />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete banner?"
        description={`"${deleting?.title}" will be removed from the home page.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success('Banner deleted'),
            onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not delete.'),
          })
          setDeleting(null)
        }}
      />
    </div>
  )
}

export default AdminBannersPage
