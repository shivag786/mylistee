import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, Clock, Users, Info, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { apiClient } from '@/services/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'
import { WhatsAppPreview } from '@/features/whatsapp/components/WhatsAppPreview'
import type { TemplateButton, TemplateVariables } from '@/features/whatsapp/types'

interface OfferTemplate {
  id: string
  name: string
  headerFormat: string | null
  header: string | null
  headerMediaUrl: string | null
  body: string
  footer: string | null
  buttons: TemplateButton[]
  variables: TemplateVariables
  /** The blanks the owner types: "body.1" → "Offer". */
  fields: { key: string; label: string; sample: string }[]
}

interface WhatsAppSummary {
  blockedReason: string | null
  quota: { limit: number | null; used: number; remaining: number | null }
  perPhoneLimit: number
  shop: { shop_name: string; shop_slug: string; shop_link: string; shop_phone: string | null; shop_image: string | null }
  templates: OfferTemplate[]
  audiences: { key: string; label: string; count: number }[]
  recent: {
    id: string
    template: string | null
    audience: string
    recipients: number
    sent: number
    failed: number
    finished: boolean
    createdAt: string | null
  }[]
}

const KEY = ['owner', 'whatsapp'] as const

/**
 * WhatsApp offers: pick one of Listee's approved, ready-made templates, type
 * your offer into its blanks, choose who gets it and send. Shows the month's
 * messages left on the plan and why sending is paused, if it is.
 */
export function OwnerWhatsAppPage() {
  usePageTitle('WhatsApp offers')
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: KEY, queryFn: () => apiClient.get<WhatsAppSummary>('business/whatsapp') })

  const [templateId, setTemplateId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [audience, setAudience] = useState('everyone')
  const [howMany, setHowMany] = useState('')
  const [confirming, setConfirming] = useState(false)

  const template = data?.templates.find((t) => t.id === templateId) ?? data?.templates[0] ?? null
  useEffect(() => setValues({}), [template?.id])
  useEffect(() => setHowMany(''), [audience])

  const send = useMutation({
    mutationFn: () =>
      apiClient.post<{ recipients: number }>('business/whatsapp', {
        template: template?.id,
        audience,
        values,
        limit: count || undefined,
      }),
    onSuccess: (res) => {
      toast.success(`Sending to ${res.recipients} customers on WhatsApp`)
      setConfirming(false)
      setValues({})
      void qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => {
      setConfirming(false)
      toast.error(e instanceof ApiError ? ((e.errors && Object.values(e.errors)[0]?.[0]) ?? e.message) : MESSAGES.errors.generic)
    },
  })

  // What the customer sees: the shop's own details and the owner's typed blanks.
  const preview = useMemo(() => {
    if (!template || !data) return null
    const context: Record<string, string> = {
      customer_name: 'Priya',
      shop_name: data.shop.shop_name,
      shop_link: data.shop.shop_link,
      shop_slug: data.shop.shop_slug,
      shop_phone: data.shop.shop_phone ?? '',
    }
    const body = template.variables.body.map((v, i) =>
      v.source === 'custom' ? values[`body.${i}`] ?? '' : v.source === 'fixed' ? v.value ?? '' : context[v.source] ?? '',
    )
    const h = template.variables.header
    const header = h ? (h.source === 'custom' ? values.header ?? '' : context[h.source] ?? '') : undefined
    const image = h?.source === 'shop_image' ? data.shop.shop_image : template.headerMediaUrl
    return { body, header, image }
  }, [template, values, data])

  if (isLoading) return <SkeletonList rows={4} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  const selected = data.audiences.find((a) => a.key === audience)
  const remaining = data.quota.remaining
  const maxSend = selected ? (remaining === null ? selected.count : Math.min(selected.count, remaining)) : 0
  const count = howMany ? Math.min(Number(howMany) || 0, maxSend) : maxSend
  const filled = template ? template.fields.every((f) => (values[f.key] ?? '').trim() !== '') : false
  const canSend = !data.blockedReason && !!template && filled && count > 0
  const usedPct = data.quota.limit ? Math.round((data.quota.used / data.quota.limit) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
          <MessageCircle className="size-6 text-[#25D366]" aria-hidden /> WhatsApp offers
        </h1>
        <p className="text-caption text-text-secondary">
          Send your offer straight to your customers’ WhatsApp. Pick a ready-made message, fill in your offer and send.
        </p>
      </header>

      <Card padding="md" className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-caption font-medium text-text-secondary">This month</p>
          <p className="text-body font-bold text-foreground">
            {data.quota.limit === null ? `${data.quota.used} sent · no limit` : `${data.quota.remaining} of ${data.quota.limit} messages left`}
          </p>
        </div>
        {data.quota.limit !== null && data.quota.limit > 0 && <Progress value={usedPct} />}
      </Card>

      {data.blockedReason && (
        <Card padding="md" className="flex items-start gap-3 border-warning/40 bg-warning-soft">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <p className="text-caption font-medium text-foreground">{data.blockedReason}</p>
        </Card>
      )}

      {data.templates.length > 0 && template && (
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {/* 1. Message */}
            <Card padding="md" className="space-y-3">
              <h2 className="text-body font-semibold text-foreground">1. Pick a message</h2>
              <div className="flex flex-wrap gap-2">
                {data.templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    aria-pressed={template.id === t.id}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-small font-medium transition-colors',
                      template.id === t.id ? 'border-[#25D366] bg-[#25D366]/10 text-foreground' : 'border-border text-text-secondary hover:border-border-strong',
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              {template.fields.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {template.fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={`wf-${f.key}`}>{f.label}</Label>
                      <Input
                        id={`wf-${f.key}`}
                        value={values[f.key] ?? ''}
                        maxLength={200}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        placeholder={f.sample ? `e.g. ${f.sample}` : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-small text-text-muted">Your shop name, link and each customer’s name are filled in for you.</p>
            </Card>

            {/* 2. Who */}
            <Card padding="md" className="space-y-3">
              <h2 className="text-body font-semibold text-foreground">2. Who should get it?</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.audiences.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAudience(a.key)}
                    aria-pressed={audience === a.key}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-2xl border p-3 text-left transition-colors',
                      audience === a.key ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border hover:border-border-strong',
                    )}
                  >
                    <span className="text-caption font-semibold text-foreground">{a.label}</span>
                    <Badge tone={audience === a.key ? 'primary' : 'neutral'} className="gap-1">
                      <Users className="size-3" aria-hidden /> {a.count}
                    </Badge>
                  </button>
                ))}
              </div>
              {selected && selected.count > 0 && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="wa-count" className="shrink-0">Send to</Label>
                  <Input
                    id="wa-count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxSend}
                    value={howMany}
                    placeholder={String(maxSend)}
                    onChange={(e) => setHowMany(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-small text-text-muted">of {maxSend} (newest first)</span>
                </div>
              )}
              <p className="text-small text-text-muted">Only people with a mobile number. Counts are numbers, one message each.</p>
            </Card>
          </div>

          <div className="space-y-2 md:sticky md:top-4 md:self-start">
            <p className="text-small font-medium text-text-muted">What customers see</p>
            <WhatsAppPreview
              headerFormat={template.headerFormat}
              header={template.header}
              headerValue={preview?.header}
              headerImageUrl={preview?.image}
              body={template.body}
              values={preview?.body}
              footer={template.footer}
              buttons={template.buttons}
              shopName={data.shop.shop_name}
            />
          </div>
        </div>
      )}

      {data.templates.length > 0 && (
        <>
          <Button className="w-full" size="lg" leftIcon={<Send className="size-4" />} disabled={!canSend} onClick={() => setConfirming(true)}>
            {!filled ? 'Fill in your offer first' : count > 0 ? `Send on WhatsApp to ${count} ${count === 1 ? 'customer' : 'customers'}` : 'Nobody to send to yet'}
          </Button>
          <p className="flex items-start gap-1.5 text-small text-text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            One offer a day, between 9 AM and 9 PM. One number gets at most {data.perPhoneLimit} offers from you a month, and anyone who replies STOP gets none.
          </p>
        </>
      )}

      {data.recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-body font-semibold text-foreground">Sent recently</h2>
          {data.recent.map((c) => (
            <Card key={c.id} padding="sm" className="flex items-start gap-3">
              {c.failed > 0 && c.sent === 0 ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              ) : (
                <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', c.finished ? 'text-success' : 'text-text-muted')} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-foreground">{c.template ?? 'Offer'}</p>
                <p className="text-small text-text-muted">
                  {c.audience} · {c.finished ? `${c.sent} sent${c.failed ? `, ${c.failed} failed` : ''}` : `sending to ${c.recipients}…`}
                  {c.createdAt && ` · ${new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`}
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <ConfirmationDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Send to ${count} customers?`}
        description={`“${template?.name ?? ''}” goes out on WhatsApp now and uses ${count} of your messages this month.`}
        confirmLabel="Send now"
        isLoading={send.isPending}
        onConfirm={() => send.mutate()}
      />
    </div>
  )
}
