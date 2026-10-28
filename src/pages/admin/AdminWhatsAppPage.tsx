import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle,
  KeyRound,
  RefreshCw,
  Plus,
  PlugZap,
  Copy,
  Trash2,
  Settings2,
  Store,
  Zap,
  CheckCheck,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { Spinner } from '@/components/feedback/Spinner'
import { apiClient } from '@/services/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { WhatsAppPreview } from '@/features/whatsapp/components/WhatsAppPreview'
import { TemplateEditorSheet } from '@/features/whatsapp/components/TemplateEditorSheet'
import { TemplateSetupSheet } from '@/features/whatsapp/components/TemplateSetupSheet'
import { STATUS_LABEL, STATUS_TONE, sampleFor, type WaAdminState, type WaMessage, type WaPreset, type WaTemplate } from '@/features/whatsapp/types'

const KEY = ['admin', 'whatsapp'] as const
const NONE = '__none__'

/**
 * Admin → WhatsApp (Interakt): connect the account, make templates and send
 * them for WhatsApp's approval (or sync ones made in Interakt), pick which
 * approved template each automatic message uses, and see every message sent.
 */
export function AdminWhatsAppPage() {
  usePageTitle('WhatsApp')
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.get<WaAdminState>('admin/whatsapp'),
  })
  const setState = (next: WaAdminState) => qc.setQueryData(KEY, next)

  if (isLoading) return <SkeletonList rows={4} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  const approved = data.templates.filter((t) => t.status === 'APPROVED').length
  const connected = data.settings.enabled && data.settings.apiKeySet

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white">
            <MessageCircle className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-title font-bold text-foreground">WhatsApp</h1>
            <p className="text-caption text-text-secondary">
              Order updates, login codes and shop offers on WhatsApp, through your Interakt account.
            </p>
          </div>
        </div>
        <Badge tone={connected ? 'success' : 'neutral'} size="md" className="gap-1.5">
          <span className={cn('size-2 rounded-full', connected ? 'bg-success' : 'bg-text-muted')} />
          {connected ? 'Connected' : data.settings.apiKeySet ? 'Switched off' : 'Not connected'}
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sent this month" value={data.month.sent} />
        <Stat label="Delivered" value={data.month.delivered} />
        <Stat label="Read" value={data.month.read} />
        <Stat label="Failed" value={data.month.failed} tone={data.month.failed > 0 ? 'danger' : undefined} />
      </div>

      <Tabs defaultValue={data.settings.apiKeySet ? 'templates' : 'connection'}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="templates">Templates ({data.templates.length})</TabsTrigger>
          <TabsTrigger value="auto">Auto messages</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="connection" className="mt-4">
          <ConnectionTab state={data} onSaved={setState} />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab state={data} onChange={setState} approved={approved} />
        </TabsContent>
        <TabsContent value="auto" className="mt-4">
          <AutoMessagesTab state={data} onSaved={setState} />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <Card padding="md" className="space-y-0.5">
      <p className="text-small text-text-muted">{label}</p>
      <p className={cn('text-title font-bold', tone === 'danger' ? 'text-destructive' : 'text-foreground')}>{value.toLocaleString('en-IN')}</p>
    </Card>
  )
}

/* ─── Connection ─────────────────────────────────────────────────────────── */

function ConnectionTab({ state, onSaved }: { state: WaAdminState; onSaved: (s: WaAdminState) => void }) {
  const s = state.settings
  const [apiKey, setApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [countryCode, setCountryCode] = useState(s.countryCode)
  const [enabled, setEnabled] = useState(s.enabled)

  useEffect(() => {
    setEnabled(s.enabled)
    setCountryCode(s.countryCode)
  }, [s.enabled, s.countryCode])

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.put<WaAdminState>('admin/whatsapp', body),
    onSuccess: (res) => {
      onSaved(res)
      setApiKey('')
      setWebhookSecret('')
      toast.success('WhatsApp settings saved')
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not save.'),
  })
  const test = useMutation({
    mutationFn: () => apiClient.post<{ templates: number }>('admin/whatsapp/test-connection'),
    onSuccess: (res) => toast.success('Connected to Interakt', `${res.templates} templates on the account.`),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not reach Interakt.'),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-body-lg font-bold text-foreground">Interakt account</h2>
            <p className="text-caption text-text-secondary">The key lives encrypted on the server and is never shown again.</p>
          </div>
          <label className="flex items-center gap-2 text-caption font-medium">
            WhatsApp on
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wa-key" className="flex items-center gap-1.5">
            <KeyRound className="size-4" aria-hidden /> API key
            {s.apiKeySet && <Badge tone="success">Saved</Badge>}
          </Label>
          <PasswordInput
            id="wa-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={s.apiKeySet ? 'Leave blank to keep the saved key' : 'Paste the secret key from Interakt'}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-hook" className="flex items-center gap-1.5">
            Webhook secret {s.webhookSecretSet && <Badge tone="success">Saved</Badge>}
          </Label>
          <PasswordInput
            id="wa-hook"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={s.webhookSecretSet ? 'Leave blank to keep it' : 'The secret you set on the webhook in Interakt'}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-cc">Country code</Label>
          <Input id="wa-cc" className="w-28" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="md" leftIcon={<PlugZap className="size-4" />} disabled={!s.apiKeySet} isLoading={test.isPending} onClick={() => test.mutate()}>
            Test connection
          </Button>
          <Button
            size="md"
            isLoading={save.isPending}
            onClick={() => save.mutate({ enabled, countryCode, apiKey: apiKey || undefined, webhookSecret: webhookSecret || undefined })}
          >
            Save
          </Button>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-body font-bold text-foreground">Set up in Interakt</h2>
        <ol className="list-decimal space-y-2 pl-4 text-caption text-text-secondary">
          <li>
            In Interakt open <b>Settings → Developer Setting</b>, copy the <b>Secret Key</b> and paste it as the API key here.
          </li>
          <li>
            On the same page add this <b>Webhook URL</b>, pick a secret key, and save the same secret here:
            <span className="mt-1.5 flex items-center gap-1 rounded-lg bg-surface-muted p-2 font-mono text-[11px] text-foreground">
              <span className="min-w-0 flex-1 break-all">{state.webhookUrl}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Copy webhook URL"
                onClick={() => {
                  void navigator.clipboard?.writeText(state.webhookUrl)
                  toast.success('Copied')
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </span>
          </li>
          <li>Tick the message status and template status events, so delivery and approvals show up here.</li>
          <li>For login codes, make an Authentication (OTP) template in Interakt, then Sync it in Templates.</li>
        </ol>
      </Card>
    </div>
  )
}

/* ─── Templates ──────────────────────────────────────────────────────────── */

function TemplatesTab({ state, onChange, approved }: { state: WaAdminState; onChange: (s: WaAdminState) => void; approved: number }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [preset, setPreset] = useState<WaPreset | null>(null)
  const [setup, setSetup] = useState<WaTemplate | null>(null)
  const [removing, setRemoving] = useState<WaTemplate | null>(null)
  const [filter, setFilter] = useState<'all' | 'shops' | 'APPROVED' | 'waiting'>('all')

  const sync = useMutation({
    mutationFn: () => apiClient.post<WaAdminState & { sync: { added: number; updated: number } }>('admin/whatsapp/sync'),
    onSuccess: (res) => {
      onChange(res)
      toast.success('Synced with Interakt', `${res.sync.added} new, ${res.sync.updated} updated.`)
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not sync.'),
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete<WaAdminState>(`admin/whatsapp/templates/${id}`),
    onSuccess: (res) => {
      onChange(res)
      setRemoving(null)
      toast.success('Template removed from Listee')
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not remove.'),
  })

  const replace = (t: WaTemplate) => {
    const exists = state.templates.some((x) => x.id === t.id)
    onChange({ ...state, templates: exists ? state.templates.map((x) => (x.id === t.id ? t : x)) : [t, ...state.templates] })
  }

  const usedNames = new Set(state.templates.map((t) => t.name))
  const presets = state.presets.filter((p) => !usedNames.has(p.name))
  const list = state.templates.filter((t) =>
    filter === 'all' ? true : filter === 'shops' ? t.forShops : filter === 'APPROVED' ? t.status === 'APPROVED' : t.status !== 'APPROVED' && t.status !== 'REJECTED',
  )

  if (!state.settings.apiKeySet) {
    return (
      <Card padding="lg" className="text-center text-caption text-text-secondary">
        Connect Interakt first (Connection tab) to make and sync templates.
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-text-secondary">
          {approved} approved of {state.templates.length}. Approval status updates by itself through the webhook, or press Sync.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="md" leftIcon={<RefreshCw className={cn('size-4', sync.isPending && 'animate-spin')} />} disabled={sync.isPending} onClick={() => sync.mutate()}>
            Sync from Interakt
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="size-4" />}
            onClick={() => {
              setPreset(null)
              setEditorOpen(true)
            }}
          >
            New template
          </Button>
        </div>
      </div>

      {presets.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-body font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden /> Ready-made templates
          </h2>
          <p className="text-small text-text-muted">One tap opens it filled in — check the words, then send it for approval.</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPreset(p)
                  setEditorOpen(true)
                }}
                className="w-56 shrink-0 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-primary-soft/40"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-caption font-semibold text-foreground">{p.title}</span>
                  <Badge tone={p.forShops ? 'primary' : 'info'}>{p.forShops ? 'For shops' : 'Auto'}</Badge>
                </span>
                <span className="mt-1.5 line-clamp-3 block whitespace-pre-line text-small text-text-muted">{p.body}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['APPROVED', 'Approved'],
              ['waiting', 'Waiting'],
              ['shops', 'For shops'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-3 py-1 text-small font-medium',
                filter === key ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-secondary hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <Card padding="lg" className="text-center text-caption text-text-muted">
            No templates here yet. Use a ready-made one above, make a new one, or sync from Interakt.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((t) => (
              <Card key={t.id} padding="md" className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-caption font-semibold text-foreground">{t.displayName}</p>
                    <p className="truncate font-mono text-[11px] text-text-muted">{t.name}</p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status] ?? 'neutral'} className="shrink-0">
                    {t.status === 'APPROVED' ? <Check className="size-3" /> : t.status === 'REJECTED' ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
                    {STATUS_LABEL[t.status] ?? t.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={t.category === 'MARKETING' ? 'premium' : t.category === 'AUTHENTICATION' ? 'info' : 'secondary'}>{t.category.toLowerCase()}</Badge>
                  {t.forShops && (
                    <Badge tone="primary">
                      <Store className="size-3" /> For shops
                    </Badge>
                  )}
                  {Object.entries(state.settings.events)
                    .filter(([, id]) => id === t.id)
                    .map(([ev]) => (
                      <Badge key={ev} tone="info">
                        <Zap className="size-3" /> {state.events.find((e) => e.key === ev)?.label ?? ev}
                      </Badge>
                    ))}
                </div>
                <WhatsAppPreview
                  className="text-[12px]"
                  headerFormat={t.headerFormat}
                  header={t.header}
                  headerValue={t.variables.header ? sampleFor(t.variables.header, state.sources) : undefined}
                  headerImageUrl={t.headerMediaUrl}
                  body={t.body}
                  values={t.variables.body.map((v) => sampleFor(v, state.sources))}
                  footer={t.footer}
                  buttons={t.buttons}
                  shopName="Sharma Sweets"
                />
                {t.status === 'REJECTED' && t.rejectionReason && <p className="text-small text-destructive">Reason: {t.rejectionReason}</p>}
                <div className="mt-auto flex justify-end gap-1">
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 className="size-4" />} onClick={() => setRemoving(t)}>
                    Remove
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Settings2 className="size-4" />} onClick={() => setSetup(t)}>
                    Set up
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <TemplateEditorSheet open={editorOpen} onOpenChange={setEditorOpen} state={state} preset={preset} onCreated={replace} />
      <TemplateSetupSheet
        template={setup}
        state={state}
        onOpenChange={(open) => !open && setSetup(null)}
        onSaved={(t) => {
          replace(t)
          setSetup(t)
        }}
      />
      <ConfirmationDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.displayName ?? ''}?`}
        description="It stops being used on Listee (automatic messages and shop offers). It stays in your Interakt account; Sync brings it back."
        confirmLabel="Remove"
        isLoading={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  )
}

/* ─── Auto messages ──────────────────────────────────────────────────────── */

function AutoMessagesTab({ state, onSaved }: { state: WaAdminState; onSaved: (s: WaAdminState) => void }) {
  const [events, setEvents] = useState<Record<string, string>>(state.settings.events)
  useEffect(() => setEvents(state.settings.events), [state.settings.events])

  const save = useMutation({
    mutationFn: () => apiClient.put<WaAdminState>('admin/whatsapp', { events }),
    onSuccess: (res) => {
      onSaved(res)
      toast.success('Automatic messages saved')
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not save.'),
  })

  const approved = state.templates.filter((t) => t.status === 'APPROVED')
  const dirty = JSON.stringify(events) !== JSON.stringify(state.settings.events)

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h2 className="text-body-lg font-bold text-foreground">Messages Listee sends by itself</h2>
        <p className="text-caption text-text-secondary">
          Pick an approved template for each one. Left empty, only the app notification goes out. Customers need a mobile number on their account.
        </p>
      </div>
      {!state.settings.enabled && (
        <p className="rounded-xl bg-warning-soft p-3 text-caption text-foreground">WhatsApp is switched off (Connection tab) — nothing goes out until it is on.</p>
      )}

      <div className="divide-y divide-border">
        {state.events.map((ev) => {
          const options = approved.filter((t) => (ev.key === 'otp' ? t.category === 'AUTHENTICATION' : t.category !== 'AUTHENTICATION'))
          const current = events[ev.key]
          const missing = current && !approved.some((t) => t.id === current)
          return (
            <div key={ev.key} className="grid gap-2 py-3 sm:grid-cols-[1fr_280px] sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-caption font-semibold text-foreground">
                  {ev.label}
                  <Badge tone={ev.to === 'shop' ? 'secondary' : 'neutral'}>to {ev.to}</Badge>
                </p>
                <p className="text-small text-text-muted">{ev.hint}</p>
                {missing && <p className="text-small text-destructive">The chosen template is not approved, so this is not sending.</p>}
              </div>
              <Select
                value={current ?? NONE}
                onValueChange={(v) => {
                  const next = { ...events }
                  if (v === NONE) delete next[ev.key]
                  else next[ev.key] = v
                  setEvents(next)
                }}
              >
                <SelectTrigger aria-label={ev.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Off — app notification only</SelectItem>
                  {options.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.displayName}
                    </SelectItem>
                  ))}
                  {missing && current && (
                    <SelectItem value={current}>{state.templates.find((t) => t.id === current)?.displayName ?? 'Removed template'}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button size="md" disabled={!dirty} isLoading={save.isPending} onClick={() => save.mutate()}>
          Save automatic messages
        </Button>
      </div>
    </Card>
  )
}

/* ─── Messages ───────────────────────────────────────────────────────────── */

const MESSAGE_TONE: Record<WaMessage['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  queued: 'neutral',
  sent: 'info',
  delivered: 'success',
  read: 'success',
  failed: 'danger',
}

const PURPOSE_LABEL: Record<string, string> = {
  campaign: 'Shop offer',
  otp: 'Login code',
  test: 'Test',
  order_placed_owner: 'New order → shop',
  order_placed: 'Order placed',
  order_accepted: 'Order accepted',
  order_ready: 'Order ready',
  order_completed: 'Order completed',
  order_cancelled: 'Order cancelled',
}

function MessagesTab() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [status, search])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'whatsapp', 'messages', status, search, page],
    queryFn: () =>
      apiClient.get<{ messages: WaMessage[]; page: number; lastPage: number; total: number }>('admin/whatsapp/messages', {
        query: { status: status === 'all' ? undefined : status, search: search || undefined, page },
      }),
    placeholderData: (prev) => prev,
  })

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-40" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Input className="h-9 w-48" inputMode="tel" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search number" aria-label="Search number" />
        {isFetching && <Spinner size={16} label="Loading" />}
        <span className="ml-auto text-small text-text-muted">{data?.total ?? 0} messages</span>
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : !data || data.messages.length === 0 ? (
        <p className="py-8 text-center text-caption text-text-muted">No messages yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-caption">
            <thead className="text-small text-text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">To</th>
                <th className="py-2 pr-3 font-medium">What</th>
                <th className="py-2 pr-3 font-medium">Shop</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.messages.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="whitespace-nowrap py-2 pr-3 text-text-secondary">
                    {m.createdAt && new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="py-2 pr-3 font-mono">{m.phone}</td>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-foreground">{PURPOSE_LABEL[m.purpose] ?? m.purpose}</p>
                    <p className="text-small text-text-muted">{m.template}</p>
                  </td>
                  <td className="py-2 pr-3 text-text-secondary">{m.business ?? '—'}</td>
                  <td className="py-2">
                    <Badge tone={MESSAGE_TONE[m.status]}>
                      {m.status === 'read' && <CheckCheck className="size-3" />}
                      {m.status}
                    </Badge>
                    {m.error && <p className="mt-1 max-w-56 text-small text-destructive">{m.error}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-small text-text-muted">
            {data.page} / {data.lastPage}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.lastPage} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </Card>
  )
}
