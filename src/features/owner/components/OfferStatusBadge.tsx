import { Badge } from '@/components/ui/badge'
import type { OfferStatus } from '../types'

const MAP: Record<OfferStatus, { tone: 'success' | 'info' | 'neutral' | 'danger' | 'warning'; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  scheduled: { tone: 'info', label: 'Scheduled' },
  expired: { tone: 'neutral', label: 'Expired' },
  sold_out: { tone: 'warning', label: 'Sold out' },
  archived: { tone: 'neutral', label: 'Archived' },
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const { tone, label } = MAP[status]
  return <Badge tone={tone}>{label}</Badge>
}
