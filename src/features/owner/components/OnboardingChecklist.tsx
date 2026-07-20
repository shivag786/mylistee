import { Check, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import type { OnboardingItem } from '../types'

/**
 * First-login onboarding checklist that celebrates progress
 * (document/phase/07 §First Login Experience). Hidden once every step is done.
 */
export function OnboardingChecklist({ items }: { items: OnboardingItem[] }) {
  const done = items.filter((i) => i.done).length
  const total = items.length
  const percent = total ? Math.round((done / total) * 100) : 0

  if (done === total) return null

  return (
    <Card className="space-y-4" elevation="soft">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-body-lg font-semibold text-foreground">Get set up</h2>
          <span className="text-caption text-text-secondary">
            {done}/{total} done
          </span>
        </div>
        <Progress value={percent} />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full',
                item.done ? 'bg-success text-success-foreground' : 'bg-surface-muted text-text-muted',
              )}
            >
              {item.done ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
            </span>
            <span
              className={cn(
                'text-body',
                item.done ? 'text-text-muted line-through' : 'text-foreground',
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
