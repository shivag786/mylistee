import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { newOptionRow, type OptionRow } from '../productEssentials'

/**
 * Name + price rows for sizes or add-ons: type, tab across, "+ Add" for
 * another. Quick-pick chips fill common names in one tap.
 */
export function OptionRowsEditor({
  rows,
  onChange,
  namePlaceholder,
  pricePlaceholder,
  addLabel,
  suggestions = [],
  max,
}: {
  rows: OptionRow[]
  onChange: (rows: OptionRow[]) => void
  namePlaceholder: string
  pricePlaceholder: string
  addLabel: string
  suggestions?: string[]
  max: number
}) {
  const unused = suggestions.filter((s) => !rows.some((r) => r.name.trim().toLowerCase() === s.toLowerCase()))

  function update(key: string, patch: Partial<OptionRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function addNamed(name: string) {
    // Fill the first blank row before adding a new one.
    const blank = rows.find((r) => !r.name.trim())
    if (blank) update(blank.key, { name })
    else if (rows.length < max) onChange([...rows, newOptionRow(name)])
  }

  return (
    <div className="space-y-2.5">
      {unused.length > 0 && rows.length < max && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addNamed(s)}
              className="rounded-full border border-dashed border-border-strong px-3 py-1 text-small font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <Input
            value={row.name}
            onChange={(e) => update(row.key, { name: e.target.value })}
            placeholder={namePlaceholder}
            aria-label="Name"
            maxLength={40}
            className="min-w-0 flex-1"
          />
          <div className="relative w-28 shrink-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-caption font-semibold text-text-secondary">
              ₹
            </span>
            <Input
              value={row.price}
              onChange={(e) => update(row.key, { price: e.target.value.replace(/[^\d.]/g, '') })}
              inputMode="decimal"
              placeholder={pricePlaceholder}
              aria-label="Price"
              className="pl-7"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
            aria-label={`Remove ${row.name || 'row'}`}
            className="grid size-10 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}

      {rows.length < max && (
        <button
          type="button"
          onClick={() => onChange([...rows, newOptionRow()])}
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline"
        >
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </button>
      )}
    </div>
  )
}
