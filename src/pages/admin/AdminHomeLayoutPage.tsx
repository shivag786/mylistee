import { useEffect, useMemo, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, LayoutList, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAdminSettings, useUpdateSettings } from '@/features/admin/hooks/useAdmin'
import {
  DEFAULT_LAYOUT,
  HOME_SECTIONS,
  HOME_SLOTS,
  resolveLayout,
  type HomeSectionSetting,
  type HomeSlot,
} from '@/features/home/homeSections'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'

const META = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s]))

const sameLayout = (a: HomeSectionSetting[], b: HomeSectionSetting[]) =>
  JSON.stringify(a.map(normalise)) === JSON.stringify(b.map(normalise))

function normalise(s: HomeSectionSetting): HomeSectionSetting {
  return { id: s.id, enabled: s.enabled, title: s.title?.trim() || null, slot: s.slot ?? 'all' }
}

/**
 * Arrange the customer home page: drag sections into order, switch them off,
 * rename headings, or show a section only in part of the day (a lunch row at
 * noon, a breakfast row in the morning).
 */
export function AdminHomeLayoutPage() {
  usePageTitle('Home layout')
  const { data, isLoading, isError, refetch } = useAdminSettings()
  const update = useUpdateSettings()
  const saved = useMemo(() => resolveLayout(data?.homeLayout).map(normalise), [data?.homeLayout])
  const [items, setItems] = useState<HomeSectionSetting[]>(saved)

  useEffect(() => setItems(saved), [saved])

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading layout" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const dirty = !sameLayout(items, saved)
  const isDefault = sameLayout(items, DEFAULT_LAYOUT)

  function patch(id: string, change: Partial<HomeSectionSetting>) {
    setItems((list) => list.map((s) => (s.id === id ? { ...s, ...change } : s)))
  }

  function move(index: number, by: number) {
    setItems((list) => {
      const to = index + by
      if (to < 0 || to >= list.length) return list
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function save(layout: HomeSectionSetting[] | null) {
    update.mutate(
      { homeLayout: layout ? layout.map(normalise) : null },
      {
        onSuccess: () => toast.success('Home layout saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save the layout.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
            <LayoutList className="size-6 text-primary" aria-hidden /> Home layout
          </h1>
          <p className="text-caption text-text-secondary">
            Drag to reorder the customer home page. Sections with nothing to show hide themselves.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={ROUTES.home} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden /> Open home page
          </a>
        </Button>
      </header>

      <Card elevation="soft" padding="md" className="max-w-3xl">
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          {items.map((item, index) => (
            <Row
              key={item.id}
              item={item}
              index={index}
              last={index === items.length - 1}
              onPatch={(change) => patch(item.id, change)}
              onMove={(by) => move(index, by)}
            />
          ))}
        </Reorder.Group>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="size-4" />}
            disabled={isDefault || update.isPending}
            onClick={() => {
              setItems(DEFAULT_LAYOUT)
            }}
          >
            Reset to default
          </Button>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-small text-warning">Unsaved changes</span>}
            <Button variant="outline" size="sm" disabled={!dirty || update.isPending} onClick={() => setItems(saved)}>
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!dirty}
              isLoading={update.isPending}
              // Saving the stock layout stores "no layout", so later default changes reach this site too.
              onClick={() => save(isDefault ? null : items)}
            >
              Save layout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Row({
  item,
  index,
  last,
  onPatch,
  onMove,
}: {
  item: HomeSectionSetting
  index: number
  last: boolean
  onPatch: (change: Partial<HomeSectionSetting>) => void
  onMove: (by: number) => void
}) {
  const controls = useDragControls()
  const meta = META[item.id]

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className={cn(
        'rounded-xl border border-border bg-surface p-3 shadow-soft',
        !item.enabled && 'bg-surface-muted opacity-70',
      )}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="mt-1 cursor-grab touch-none rounded p-1 text-text-muted hover:bg-surface-muted active:cursor-grabbing"
          aria-label={`Drag ${meta.label}`}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body font-semibold text-foreground">
                <span className="mr-1.5 text-text-muted">{index + 1}.</span>
                {meta.label}
              </p>
              <p className="text-small text-text-secondary">{meta.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="ghost" className="px-2" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
                <ArrowUp className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" className="px-2" disabled={last} onClick={() => onMove(1)} aria-label="Move down">
                <ArrowDown className="size-4" />
              </Button>
              <Switch checked={item.enabled} onCheckedChange={(v) => onPatch({ enabled: v })} aria-label={`Show ${meta.label}`} />
            </div>
          </div>

          {item.enabled && (
            <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
              {meta.defaultTitle ? (
                <Input
                  value={item.title ?? ''}
                  onChange={(e) => onPatch({ title: e.target.value })}
                  placeholder={`Heading: ${meta.defaultTitle}`}
                  maxLength={40}
                  className="h-9 text-caption"
                  aria-label={`${meta.label} heading`}
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              <select
                value={item.slot ?? 'all'}
                onChange={(e) => onPatch({ slot: e.target.value as HomeSlot })}
                className="h-9 rounded-input border border-border bg-surface px-2 text-caption text-foreground focus:border-primary focus:outline-none"
                aria-label={`${meta.label} time of day`}
              >
                {HOME_SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                    {s.hours ? ` (${s.hours})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </Reorder.Item>
  )
}
