import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Phone, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/services/apiClient'
import { toast } from '@/utils/toast'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pager, StatTile, WhatsAppButton } from '@/features/admin/components/InsightBits'
import type { PageInfo } from '@/features/admin/insights'

interface Enquiry {
  id: string
  name: string
  phone: string
  email: string | null
  city: string | null
  businessName: string | null
  businessType: string | null
  topic: 'shop' | 'partner' | 'support' | 'other'
  message: string | null
  source: string | null
  status: 'new' | 'contacted' | 'converted' | 'closed'
  notes: string | null
  createdAt: string | null
}

interface EnquiriesData {
  counts: Record<Enquiry['status'], number>
  items: Enquiry[]
  meta: PageInfo
}

const TOPIC: Record<Enquiry['topic'], string> = { shop: 'Wants Listee', partner: 'Partner / referral', support: 'Support', other: 'Other' }
const STATUSES: Enquiry['status'][] = ['new', 'contacted', 'converted', 'closed']
const TONE: Record<Enquiry['status'], 'info' | 'warning' | 'success' | 'neutral'> = { new: 'info', contacted: 'warning', converted: 'success', closed: 'neutral' }

/** Website enquiries: call back, note what was said, and move each one along. */
export function AdminEnquiriesPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = { status, search, page }
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'enquiries', query] as const,
    queryFn: () =>
      apiClient.get<EnquiriesData>('admin/enquiries', {
        query: { status, page, ...(search ? { search } : {}) },
      }),
    placeholderData: keepPreviousData,
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; notes?: string }) => apiClient.patch<Enquiry>(`admin/enquiries/${id}`, body),
    onSuccess: () => {
      toast.success('Saved')
      void qc.invalidateQueries({ queryKey: ['admin', 'enquiries'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save.'),
  })

  const pick = (s: string) => {
    setStatus(s)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Enquiries</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">People who asked for a call back from listee.org (contact, city and guide pages). You also get a notification for each new one.</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUSES.map((s) => (
          <StatTile key={s} label={s[0].toUpperCase() + s.slice(1)} value={data?.counts[s] ?? '…'} active={status === s} onClick={() => pick(status === s ? 'all' : s)} />
        ))}
      </div>

      <AdminToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1) }} placeholder="Search name, phone, city, shop…" />

      {isLoading && <p className="text-text-muted">Loading…</p>}
      {data && data.items.length === 0 && <Card padding="lg"><p className="text-text-muted">No enquiries here yet.</p></Card>}

      <div className="space-y-3">
        {data?.items.map((e) => <EnquiryCard key={e.id} e={e} onSave={(body) => update.mutate({ id: e.id, ...body })} saving={update.isPending} />)}
      </div>
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  )
}

function EnquiryCard({ e, onSave, saving }: { e: Enquiry; onSave: (b: { status?: string; notes?: string }) => void; saving: boolean }) {
  const [notes, setNotes] = useState(e.notes ?? '')
  return (
    <Card elevation="soft" padding="md" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">
            {e.name} {e.businessName && <span className="text-text-secondary">· {e.businessName}</span>}
          </p>
          <p className="text-small text-text-muted">
            {[e.city, e.businessType, e.email].filter(Boolean).join(' · ')}
            {e.createdAt && ` · ${new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone={TONE[e.status]}>{e.status}</Badge>
            <Badge tone="neutral">{TOPIC[e.topic]}</Badge>
            {e.source && <Badge tone="neutral">from {e.source}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-small font-medium text-foreground">
            <Phone className="size-3.5" /> {e.phone}
          </a>
          <WhatsAppButton phone={e.phone} text={`Hi ${e.name}, this is the Listee team. Thanks for your enquiry${e.businessName ? ` for ${e.businessName}` : ''}! When is a good time for a quick call to set up Listee for you?`} />
        </div>
      </div>
      {e.message && <p className="rounded-lg bg-surface-muted p-3 text-small text-foreground">{e.message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea rows={2} value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Notes from the call…" className="flex-1" />
        <div className="flex gap-2">
          <select
            aria-label="Status"
            value={e.status}
            onChange={(ev) => onSave({ status: ev.target.value })}
            className="h-10 rounded-input border border-border bg-surface px-2 text-body"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" variant="outline" disabled={saving || notes === (e.notes ?? '')} onClick={() => onSave({ notes })}>Save note</Button>
        </div>
      </div>
    </Card>
  )
}
