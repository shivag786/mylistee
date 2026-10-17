import { useState } from 'react'
import { Copy, Gift, Link2, MessageCircle, RefreshCw, RotateCcw, Settings2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { PersonalLinkHistory } from '@/features/owner/components/PersonalLinkHistory'
import { expiryAfterAdding, type PersonalLinkPackKey } from '@/features/owner/personalLink'
import {
  adminPersonalLinkService,
  useAdminPersonalLink,
  useAdminPersonalLinks,
  usePersonalLinkAction,
  type AdminPersonalLinkRow,
  type GrantPayload,
  type PersonalLinkFilters,
  type PersonalLinkStatusFilter,
} from '@/features/admin/personalLinks'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring in 7 days' },
  { value: 'expired', label: 'Expired' },
  { value: 'never', label: 'Never used' },
]

const fmtDate = (iso: string | Date | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const errText = (e: unknown, fallback: string) => (e instanceof ApiError || e instanceof Error ? e.message : fallback)

function statusOf(r: AdminPersonalLinkRow): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (r.active && r.daysLeft <= 7) return { label: `${r.daysLeft}d left`, tone: 'warning' }
  if (r.active) return { label: `${r.daysLeft}d left`, tone: 'success' }
  if (r.expiresAt) return { label: 'Expired', tone: 'danger' }
  return { label: 'Never used', tone: 'neutral' }
}

/** Admin: every shop's personal link, and giving packages free or by payment link. */
export function AdminPersonalLinksPage() {
  const [filters, setFilters] = useState<PersonalLinkFilters>({ page: 1 })
  const { data, isLoading, isFetching } = useAdminPersonalLinks(filters)
  const [managing, setManaging] = useState<AdminPersonalLinkRow | null>(null)

  const columns: Column<AdminPersonalLinkRow>[] = [
    {
      key: 'shop',
      label: 'Shop',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.name}</p>
          <p className="truncate text-small text-text-muted">{[r.ownerName, r.phone].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      cell: (r) => {
        const s = statusOf(r)
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge tone={s.tone}>{s.label}</Badge>
            {r.enabled === false && r.active === false && r.trialUsed && <Badge tone="neutral">Off</Badge>}
            {r.pendingLinks > 0 && <Badge tone="info">{r.pendingLinks} link unpaid</Badge>}
          </div>
        )
      },
    },
    { key: 'expiry', label: 'Expires', className: 'tabular-nums', cell: (r) => fmtDate(r.expiresAt) },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (r) => (
        <Button size="sm" variant="outline" leftIcon={<Settings2 className="size-4" />} onClick={() => setManaging(r)}>
          Manage
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Personal links</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">
        Give any shop a package — free (or paid to you in cash/UPI), or send them a Razorpay payment link. Days are
        always added on top of what the shop has left, and every package is kept in its history.
      </p>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search shop, owner or phone…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status: status as PersonalLinkStatusFilter, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No shops match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}

      {managing && <ManageDialog row={managing} onClose={() => setManaging(null)} />}
    </div>
  )
}

const PACK_CHOICES: { key: PersonalLinkPackKey | 'custom'; label: string }[] = [
  { key: 'month', label: '30 days' },
  { key: 'quarter', label: '90 days' },
  { key: 'year', label: '1 year' },
  { key: 'custom', label: 'Custom' },
]

function ManageDialog({ row, onClose }: { row: AdminPersonalLinkRow; onClose: () => void }) {
  const { data, isLoading } = useAdminPersonalLink(row.id)
  const grant = usePersonalLinkAction((p: GrantPayload) => adminPersonalLinkService.grant(row.id, p))
  const sync = usePersonalLinkAction((id: string) => adminPersonalLinkService.sync(id))
  const cancel = usePersonalLinkAction((id: string) => adminPersonalLinkService.cancel(id))

  const [pack, setPack] = useState<PersonalLinkPackKey | 'custom'>('month')
  const [customDays, setCustomDays] = useState('15')
  const [mode, setMode] = useState<'free' | 'link'>('free')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [createdLink, setCreatedLink] = useState<string | null>(null)

  const state = data?.state
  const packInfo = state?.packs.find((p) => p.key === pack)
  const days = pack === 'custom' ? Number(customDays) || 0 : packInfo?.days ?? 0
  const defaultPrice = pack === 'custom' ? days * 5 : packInfo?.price ?? 0
  const valid = days >= 1 && days <= 3650 && (mode === 'free' || (amount.trim() === '' ? defaultPrice : Number(amount)) >= 1)
  const newExpiry = state ? expiryAfterAdding(state.active ? state.expiresAt : null, days) : null

  function submit() {
    if (!valid) return
    const payload: GrantPayload = {
      pack,
      days: pack === 'custom' ? days : undefined,
      mode,
      amount: amount.trim() === '' ? (mode === 'link' ? undefined : 0) : Number(amount),
      note: note.trim() || undefined,
      notify,
    }
    grant.mutate(payload, {
      onSuccess: (res) => {
        if (mode === 'link') {
          setCreatedLink(res.grant.linkUrl)
          toast.success('Payment link created')
        } else {
          toast.success(`${days} days added — valid till ${fmtDate(res.grant.expiresAfter)}`)
        }
        setAmount('')
        setNote('')
      },
      onError: (e) => toast.error(errText(e, 'Could not give the package.')),
    })
  }

  const whatsapp = (url: string) =>
    `https://wa.me/${(data?.business.phone ?? '').replace(/\D/g, '').slice(-10).replace(/^(\d{10})$/, '91$1')}?text=${encodeURIComponent(
      `Hi ${data?.business.name}, here is your Listee personal link payment (${days} days): ${url}`,
    )}`

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
          <DialogDescription>
            {state
              ? state.active
                ? `Active · ${state.daysLeft} days left · expires ${fmtDate(state.expiresAt)}`
                : state.expiresAt
                  ? `Expired on ${fmtDate(state.expiresAt)}`
                  : 'Has never used the personal link'
              : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !state ? (
          <div className="grid place-items-center py-10">
            <Spinner size={28} />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Give a package */}
            <section className="space-y-3 rounded-xl border border-border p-3">
              <p className="font-semibold text-foreground">Give a package</p>

              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Package">
                {PACK_CHOICES.map((c) => {
                  const info = state.packs.find((p) => p.key === c.key)
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={pack === c.key}
                      onClick={() => setPack(c.key)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-center text-small font-semibold transition-colors',
                        pack === c.key ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-secondary',
                      )}
                    >
                      {c.label}
                      {info && <span className="block font-normal">₹{info.price}</span>}
                    </button>
                  )
                })}
              </div>
              {pack === 'custom' && (
                <div className="space-y-1.5">
                  <Label htmlFor="pl-days">Days</Label>
                  <Input id="pl-days" type="number" min={1} max={3650} value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="max-w-[140px]" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="How">
                <ModeButton active={mode === 'free'} onClick={() => setMode('free')} icon={<Gift className="size-4" />} title="Without payment" hint="Free, or paid to you offline" />
                <ModeButton active={mode === 'link'} onClick={() => setMode('link')} icon={<Link2 className="size-4" />} title="With payment" hint="Send a Razorpay link" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pl-amount">{mode === 'free' ? 'Amount received (₹)' : 'Amount to pay (₹)'}</Label>
                  <Input
                    id="pl-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder={mode === 'free' ? '0 (free)' : String(defaultPrice)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pl-note">Note</Label>
                  <Input
                    id="pl-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={255}
                    placeholder={mode === 'free' ? 'e.g. Cash received / launch offer' : 'Optional'}
                  />
                </div>
              </div>

              {mode === 'link' && (
                <label className="flex items-center justify-between gap-3 text-small text-text-secondary">
                  Razorpay also sends the link by SMS / email to the shop
                  <Switch checked={notify} onCheckedChange={setNotify} aria-label="Notify shop" />
                </label>
              )}

              {newExpiry && days > 0 && (
                <p className="rounded-lg bg-surface-muted px-3 py-2 text-small text-text-secondary">
                  {mode === 'link' ? 'Once paid, ' : ''}
                  {state.active ? `${state.daysLeft} days left + ${days} days → ` : `${days} days from today → `}
                  valid till <b className="text-foreground">{fmtDate(newExpiry)}</b>
                </p>
              )}

              <Button fullWidth size="md" disabled={!valid} isLoading={grant.isPending} onClick={submit}>
                {mode === 'free' ? `Add ${days} days now` : 'Create payment link'}
              </Button>

              {createdLink && (
                <div className="space-y-2 rounded-lg border border-success/40 bg-success-soft/50 p-3">
                  <p className="text-small font-semibold text-foreground">Payment link ready — share it with the shop</p>
                  <p className="break-all font-mono text-small text-text-secondary">{createdLink}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftIcon={<Copy className="size-4" />} onClick={() => void navigator.clipboard.writeText(createdLink).then(() => toast.success('Link copied'))}>
                      Copy
                    </Button>
                    <Button size="sm" variant="success" leftIcon={<MessageCircle className="size-4" />} onClick={() => window.open(whatsapp(createdLink), '_blank', 'noopener')}>
                      WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* History */}
            <section className="space-y-1">
              <p className="font-semibold text-foreground">Package history</p>
              <PersonalLinkHistory
                items={state.history}
                actions={(g) =>
                  g.status === 'pending' ? (
                    <>
                      {g.linkUrl && (
                        <Button size="sm" variant="ghost" leftIcon={<Copy className="size-4" />} onClick={() => void navigator.clipboard.writeText(g.linkUrl!).then(() => toast.success('Link copied'))}>
                          Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RefreshCw className="size-4" />}
                        isLoading={sync.isPending && sync.variables === g.id}
                        onClick={() =>
                          sync.mutate(g.id, {
                            onSuccess: (d) =>
                              d.state.history.find((h) => h.id === g.id)?.status === 'active'
                                ? toast.success('Paid — days added')
                                : toast.info('Not paid yet'),
                            onError: (e) => toast.error(errText(e, 'Could not check.')),
                          })
                        }
                      >
                        Check
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<XCircle className="size-4" />}
                        isLoading={cancel.isPending && cancel.variables === g.id}
                        onClick={() =>
                          cancel.mutate(g.id, {
                            onSuccess: () => toast.success('Link cancelled'),
                            onError: (e) => toast.error(errText(e, 'Could not cancel.')),
                          })
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null
                }
              />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors',
        active ? 'border-primary bg-primary-soft' : 'border-border',
      )}
    >
      <span className={cn('mt-0.5', active ? 'text-primary' : 'text-text-muted')}>{icon}</span>
      <span>
        <span className={cn('block text-small font-semibold', active ? 'text-primary' : 'text-foreground')}>{title}</span>
        <span className="block text-[11px] text-text-muted">{hint}</span>
      </span>
    </button>
  )
}
