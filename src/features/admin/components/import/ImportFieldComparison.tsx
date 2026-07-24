import { ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { AdminBusiness, ImportPreview } from '@/features/admin/types'

/** The owner-editable fields we compare before overwriting (SPEC-011 §comparison). */
export type ComparableField = 'name' | 'phone' | 'website' | 'address' | 'category'

export type FieldChoice = 'existing' | 'imported'

const FIELDS: { key: ComparableField; label: string }[] = [
  { key: 'name', label: 'Business Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Address' },
  { key: 'category', label: 'Category' },
]

interface ImportFieldComparisonProps {
  existing: AdminBusiness
  preview: ImportPreview
  choices: Record<ComparableField, FieldChoice>
  onChange: (field: ComparableField, choice: FieldChoice) => void
}

/**
 * SPEC-011 §comparison screen. For each owner-editable field, shows the current
 * value beside the imported one and lets the admin pick which to keep. Defaults
 * favor keeping existing data — nothing is overwritten without a choice.
 */
export function ImportFieldComparison({ existing, preview, choices, onChange }: ImportFieldComparisonProps) {
  return (
    <div className="space-y-3">
      {FIELDS.map(({ key, label }) => {
        const current = (existing[key] ?? '') as string
        const incoming = (preview[key] ?? '') as string
        const same = String(current).trim() === String(incoming).trim()

        return (
          <div key={key} className="rounded-xl border border-border p-3">
            <p className="mb-2 text-small font-semibold text-text-muted">{label}</p>
            <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <ChoiceCell
                selected={choices[key] === 'existing'}
                onSelect={() => onChange(key, 'existing')}
                heading="Current"
                value={current}
                tone="neutral"
              />
              <div className="hidden items-center justify-center text-text-muted sm:flex">
                <ArrowRight className="size-4" aria-hidden />
              </div>
              <ChoiceCell
                selected={choices[key] === 'imported'}
                onSelect={() => onChange(key, 'imported')}
                heading={same ? 'Imported (same)' : 'Imported'}
                value={incoming}
                tone="primary"
                disabled={same}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChoiceCell({
  selected,
  onSelect,
  heading,
  value,
  tone,
  disabled,
}: {
  selected: boolean
  onSelect: () => void
  heading: string
  value: string
  tone: 'neutral' | 'primary'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? tone === 'primary'
            ? 'border-primary bg-primary-soft'
            : 'border-foreground/40 bg-surface-muted'
          : 'border-border hover:bg-surface-muted',
      )}
    >
      <span className="block text-small text-text-muted">{heading}</span>
      <span className="block truncate text-body text-foreground">
        {value?.trim() ? value : <span className="text-text-muted">—</span>}
      </span>
    </button>
  )
}
