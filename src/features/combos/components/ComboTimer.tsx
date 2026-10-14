import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@/utils/cn'

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** "05:42:18" */
function clock(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/**
 * How long a combo has left, for urgency. More than a day out it reads
 * "2 days left"; inside the last day it becomes a live HH:MM:SS countdown, and
 * the last hour turns red and pulses. Renders nothing once the time is up or
 * when the combo has no end.
 */
export function ComboTimer({ endsAt, className }: { endsAt: string | null | undefined; className?: string }) {
  const end = endsAt ? new Date(endsAt).getTime() : NaN
  const [now, setNow] = useState(() => Date.now())
  const left = end - now
  const live = left > 0 && left <= DAY

  useEffect(() => {
    if (Number.isNaN(end)) return
    // Tick every second inside the last day; otherwise a minute is plenty.
    const t = setInterval(() => setNow(Date.now()), live ? 1000 : 60_000)
    return () => clearInterval(t)
  }, [end, live])

  if (Number.isNaN(end) || left <= 0) return null

  const lastHour = left <= HOUR
  const days = Math.ceil(left / DAY)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-small font-bold shadow-sm tabular-nums',
        lastHour
          ? 'bg-destructive text-white motion-safe:animate-pulse'
          : live
            ? 'bg-warning text-warning-foreground'
            : 'bg-black/55 text-white backdrop-blur',
        className,
      )}
    >
      <Timer className="size-3.5 shrink-0" aria-hidden />
      {lastHour ? `Last hour · ${clock(left)}` : live ? `Ends in ${clock(left)}` : `${days} days left`}
    </span>
  )
}
