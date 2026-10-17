import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import type { FoodType } from '../productTypes'

const OPTIONS: { value: FoodType; label: string; emoji: string; mark: string; active: string }[] = [
  {
    value: 'veg',
    label: 'Veg',
    emoji: '🥗',
    mark: 'border-success text-success',
    active: 'border-success bg-success-soft ring-2 ring-success/30',
  },
  {
    value: 'non_veg',
    label: 'Non-veg',
    emoji: '🍗',
    mark: 'border-destructive text-destructive',
    active: 'border-destructive bg-danger-soft ring-2 ring-destructive/30',
  },
  {
    value: 'egg',
    label: 'Egg',
    emoji: '🥚',
    mark: 'border-warning text-warning',
    active: 'border-warning bg-warning-soft ring-2 ring-warning/30',
  },
]

/**
 * Veg / non-veg / egg as three picture cards with the familiar square food
 * mark. Optional: tapping the chosen card again clears it (not a food item).
 */
export function FoodTypePicker({
  value,
  onChange,
}: {
  value: FoodType | null
  onChange: (value: FoodType | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        Food type <span className="font-normal text-text-muted">(optional)</span>
      </Label>
      <div role="radiogroup" className="grid grid-cols-3 gap-2.5">
        {OPTIONS.map((o) => {
          const active = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : o.value)}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-2xl border bg-surface px-2 pb-2.5 pt-3 transition-all active:scale-95',
                active ? o.active : 'border-border hover:border-border-strong',
              )}
            >
              <span className="text-[28px] leading-none" aria-hidden>
                {o.emoji}
              </span>
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-foreground">
                <FoodMark className={o.mark} triangle={o.value === 'non_veg'} />
                {o.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** The square veg/non-veg symbol: a dot inside, or a triangle for non-veg. */
function FoodMark({ className, triangle }: { className: string; triangle?: boolean }) {
  return (
    <span className={cn('grid size-3.5 place-items-center rounded-[3px] border-[1.5px]', className)} aria-hidden>
      {triangle ? (
        <span className="size-0 border-x-[3.5px] border-b-[6px] border-x-transparent border-b-current" />
      ) : (
        <span className="size-1.5 rounded-full bg-current" />
      )}
    </span>
  )
}
