import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PageInfo } from '@/features/admin/insights'
import { whatsappLink } from '@/features/admin/insights'

export function StatTile({ label, value, tone, active, onClick }: { label: string; value: number | string; tone?: string; active?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <p className="text-small text-text-secondary">{label}</p>
      <p className={`text-title font-bold tabular-nums ${tone ?? 'text-foreground'}`}>{value}</p>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={`rounded-xl border bg-surface p-3 text-left transition ${active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:bg-surface-muted'}`}>
      {body}
    </button>
  ) : (
    <Card elevation="soft" padding="md">{body}</Card>
  )
}

export function Pager({ meta, onPage }: { meta?: PageInfo; onPage: (p: number) => void }) {
  if (!meta || meta.total === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <p className="text-small text-text-muted">Page {meta.page} of {meta.lastPage} · {meta.total} total</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} leftIcon={<ChevronLeft className="size-4" />}>Prev</Button>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.lastPage} onClick={() => onPage(meta.page + 1)} rightIcon={<ChevronRight className="size-4" />}>Next</Button>
      </div>
    </div>
  )
}

/** Opens WhatsApp with a ready message to the shop owner. */
export function WhatsAppButton({ phone, text }: { phone: string | null; text: string }) {
  const href = whatsappLink(phone, text)
  if (!href) return <span className="text-small text-text-muted">—</span>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-small font-medium text-success hover:opacity-90">
      <MessageCircle className="size-3.5" /> WhatsApp
    </a>
  )
}
