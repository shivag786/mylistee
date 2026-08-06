import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, QrCode as QrIcon, Download, Link2, Bike, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import {
  useServiceSettings,
  useUpdateServiceSettings,
  useTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
} from '@/features/owner/hooks/useServiceSettings'
import type { OwnerTable } from '@/features/owner/services/serviceSettingsService'
import { SERVICE_TYPES, SERVICE_META, type ServiceType } from '@/features/orders/serviceTypes'
import { generateQrDataUrl, downloadDataUrl } from '@/utils/qr'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

export function TablesPage() {
  usePageTitle('Tables & service')
  const settings = useServiceSettings()
  const tables = useTables()

  if (settings.isLoading || tables.isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading service settings" />
      </div>
    )
  }
  if (settings.isError || !settings.data) {
    return <ErrorState onRetry={() => void settings.refetch()} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title font-bold text-foreground">Tables &amp; service</h1>
        <p className="text-caption text-text-secondary">
          Choose how customers get their order, and set up dining tables for QR self-ordering.
        </p>
      </div>

      <ServiceModesCard />

      <TablesSection dineInEnabled={settings.data.modes.includes('dine_in')} tables={tables.data ?? []} />
    </div>
  )
}

/* ------------------------------------------------------------------ modes -- */

function ServiceModesCard() {
  const { data } = useServiceSettings()
  const update = useUpdateServiceSettings()

  const [enabled, setEnabled] = useState<Record<ServiceType, boolean>>({
    pickup: true,
    dine_in: false,
    takeaway: false,
    delivery: false,
  })
  const [defaultMode, setDefaultMode] = useState<ServiceType>('pickup')
  const [deliveryFee, setDeliveryFee] = useState('0')

  // Sync local form from server whenever it (re)loads.
  useEffect(() => {
    if (!data) return
    setEnabled({
      pickup: true,
      dine_in: data.modes.includes('dine_in'),
      takeaway: data.modes.includes('takeaway'),
      delivery: data.modes.includes('delivery'),
    })
    setDefaultMode(data.defaultMode)
    setDeliveryFee(String(data.deliveryFee ?? 0))
  }, [data])

  const enabledList = useMemo(
    () => SERVICE_TYPES.filter((t) => enabled[t]),
    [enabled],
  )

  function toggle(mode: ServiceType, next: boolean) {
    if (mode === 'pickup') return // pickup is the always-on floor
    setEnabled((prev) => ({ ...prev, [mode]: next }))
    // If we just disabled the default mode, fall back to pickup.
    if (!next && defaultMode === mode) setDefaultMode('pickup')
  }

  function save() {
    const fee = Math.max(0, Number(deliveryFee) || 0)
    const finalDefault = enabledList.includes(defaultMode) ? defaultMode : enabledList[0]
    update.mutate(
      { modes: enabledList, defaultMode: finalDefault, deliveryFee: fee },
      {
        onSuccess: () => toast.success('Service settings saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
  }

  return (
    <Card className="space-y-4" padding="lg">
      <div>
        <h2 className="text-body-lg font-semibold text-foreground">How customers get their order</h2>
        <p className="text-caption text-text-secondary">Turn on every mode your business offers.</p>
      </div>

      <div className="space-y-2">
        {SERVICE_TYPES.map((mode) => {
          const meta = SERVICE_META[mode]
          const Icon = meta.icon
          const isPickup = mode === 'pickup'
          return (
            <div key={mode} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-text-secondary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-body font-medium text-foreground">
                    {meta.label}
                    {isPickup && <Badge tone="neutral">Always on</Badge>}
                  </span>
                  <span className="block truncate text-caption text-text-muted">{meta.hint}</span>
                </span>
              </span>
              <Switch checked={enabled[mode]} disabled={isPickup} onCheckedChange={(v) => toggle(mode, v)} />
            </div>
          )
        })}
      </div>

      {/* Default mode + delivery fee */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-caption font-medium text-foreground">Default at checkout</span>
          <select
            value={defaultMode}
            onChange={(e) => setDefaultMode(e.target.value as ServiceType)}
            className="h-13 w-full rounded-input border border-border bg-surface px-4 text-body text-foreground focus:border-primary focus:outline-none"
          >
            {enabledList.map((t) => (
              <option key={t} value={t}>
                {SERVICE_META[t].label}
              </option>
            ))}
          </select>
        </label>

        {enabled.delivery && (
          <label className="space-y-1">
            <span className="flex items-center gap-1.5 text-caption font-medium text-foreground">
              <Bike className="size-3.5 text-text-muted" aria-hidden /> Delivery fee (₹)
            </span>
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} isLoading={update.isPending}>
          Save
        </Button>
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------------- tables -- */

function TablesSection({ dineInEnabled, tables }: { dineInEnabled: boolean; tables: OwnerTable[] }) {
  const create = useCreateTable()
  const updateTable = useUpdateTable()
  const del = useDeleteTable()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OwnerTable | null>(null)
  const [qrTable, setQrTable] = useState<OwnerTable | null>(null)
  const [deleting, setDeleting] = useState<OwnerTable | null>(null)

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(t: OwnerTable) {
    setEditing(t)
    setFormOpen(true)
  }

  function submit(input: { label: string; capacity: number | null; status: 'active' | 'inactive' }) {
    const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    if (editing) {
      updateTable.mutate(
        { id: editing.id, input },
        { onSuccess: () => { toast.success('Table updated'); setFormOpen(false) }, onError },
      )
    } else {
      create.mutate(
        { label: input.label, capacity: input.capacity },
        { onSuccess: () => { toast.success('Table added'); setFormOpen(false) }, onError },
      )
    }
  }

  return (
    <Card className="space-y-4" padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body-lg font-semibold text-foreground">Dining tables</h2>
          <p className="text-caption text-text-secondary">
            Each table gets a QR — customers scan it to order straight to that table.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={openAdd}>
          Add table
        </Button>
      </div>

      {!dineInEnabled && (
        <p className="flex items-start gap-2 rounded-xl bg-info-soft p-3 text-caption text-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Turn on <strong>Dine-in</strong> above for these tables to appear at checkout. You can still set them up now.</span>
        </p>
      )}

      {tables.length === 0 ? (
        <EmptyState
          icon={<QrIcon className="size-7" />}
          title="No tables yet"
          description="Add your first table to generate its QR code."
        />
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {tables.map((t) => (
            <StaggerItem key={t.id}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-body font-medium text-foreground">
                    {t.label}
                    {t.status === 'inactive' && <Badge tone="neutral">Off</Badge>}
                  </p>
                  <p className="text-caption text-text-muted">
                    {t.capacity ? `${t.capacity} seats · ` : ''}{t.scanCount} scans
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label="Show QR" onClick={() => setQrTable(t)}>
                    <QrIcon className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => openEdit(t)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => setDeleting(t)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <TableFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        table={editing}
        busy={create.isPending || updateTable.isPending}
        onSubmit={submit}
      />

      <TableQrDialog table={qrTable} onClose={() => setQrTable(null)} />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this table?"
        description={`“${deleting?.label}” and its QR will stop working. Existing orders keep their record.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return
          del.mutate(deleting.id, {
            onSuccess: () => toast.success('Table deleted'),
            onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
          })
          setDeleting(null)
        }}
      />
    </Card>
  )
}

function TableFormDialog({
  open,
  onOpenChange,
  table,
  busy,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: OwnerTable | null
  busy?: boolean
  onSubmit: (input: { label: string; capacity: number | null; status: 'active' | 'inactive' }) => void
}) {
  const [label, setLabel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    if (open) {
      setLabel(table?.label ?? '')
      setCapacity(table?.capacity ? String(table.capacity) : '')
      setStatus(table?.status ?? 'active')
    }
  }, [open, table])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? 'Edit table' : 'Add table'}</DialogTitle>
          <DialogDescription>Name it however you call it — “Table 5”, “T1”, “Rooftop 2”.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-caption font-medium text-foreground">Label</span>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Table 5" maxLength={40} />
          </label>
          <label className="space-y-1">
            <span className="text-caption font-medium text-foreground">Seats (optional)</span>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="4" />
          </label>
          {table && (
            <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
              <span className="text-caption font-medium text-foreground">Active</span>
              <Switch checked={status === 'active'} onCheckedChange={(v) => setStatus(v ? 'active' : 'inactive')} />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            isLoading={busy}
            disabled={!label.trim()}
            onClick={() =>
              onSubmit({
                label: label.trim(),
                capacity: capacity ? Math.max(1, Number(capacity)) : null,
                status,
              })
            }
          >
            {table ? 'Save' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TableQrDialog({ table, onClose }: { table: OwnerTable | null; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    setDataUrl(null)
    if (!table?.qrUrl) return
    let active = true
    void generateQrDataUrl(table.qrUrl).then((url) => {
      if (active) setDataUrl(url)
    })
    return () => {
      active = false
    }
  }, [table])

  async function copyLink() {
    if (!table?.qrUrl) return
    try {
      await navigator.clipboard.writeText(table.qrUrl)
      toast.success('Link copied')
    } catch {
      /* clipboard denied — no-op */
    }
  }

  return (
    <Dialog open={table !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table?.label} QR</DialogTitle>
          <DialogDescription>Print it and place it on the table. Scanning opens the menu bound to this table.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            {dataUrl ? (
              <img src={dataUrl} alt={`QR for ${table?.label}`} className="size-52" width={208} height={208} />
            ) : (
              <div className="grid size-52 place-items-center">
                <Spinner size={28} />
              </div>
            )}
          </div>
          {table?.qrUrl && <p className="max-w-xs break-all text-center text-small text-text-muted">{table.qrUrl}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" leftIcon={<Link2 className="size-4" />} onClick={() => void copyLink()}>
            Copy link
          </Button>
          <Button
            leftIcon={<Download className="size-4" />}
            disabled={!dataUrl}
            onClick={() => dataUrl && table && downloadDataUrl(dataUrl, `${table.label.replace(/\s+/g, '-').toLowerCase()}-qr.png`)}
          >
            PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
