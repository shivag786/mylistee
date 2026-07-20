import { Badge } from '@/components/ui/badge'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const TONE: Record<string, Tone> = {
  active: 'success',
  published: 'success',
  verified: 'success',
  paid: 'success',
  pending: 'warning',
  scheduled: 'warning',
  draft: 'warning',
  suspended: 'danger',
  blocked: 'danger',
  rejected: 'danger',
  hidden: 'danger',
  failed: 'danger',
  expired: 'neutral',
  sold_out: 'neutral',
  archived: 'neutral',
}

/** Consistent coloured status chip across admin tables. */
export function StatusPill({ status }: { status: string }) {
  const tone = TONE[status] ?? 'neutral'
  return (
    <Badge tone={tone} size="sm" className="capitalize">
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
