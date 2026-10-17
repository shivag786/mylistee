import { useMemo, useState, type ReactNode } from 'react'
import { Check, Search } from 'lucide-react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { cn } from '@/utils/cn'

export interface ChoiceOption {
  id: string
  name: string
}

interface ChoiceChipsProps {
  id?: string
  options: ChoiceOption[]
  value: string | null
  onChange: (id: string) => void
  loading?: boolean
  disabled?: boolean
  invalid?: boolean
  /** Shown once there are enough options to need it. */
  searchPlaceholder?: string
  /** Extra chips after the options (e.g. "+ New section"). */
  trailing?: ReactNode
}

/** Past this many options a search box appears above the chips. */
const SEARCH_FROM = 8

/**
 * Single-choice picker as wrapping chips. Every option is one tap away and
 * nothing pops over the form, so it can't get stuck the way a Select inside a
 * sheet can on mobile browsers.
 */
export function ChoiceChips({
  id,
  options,
  value,
  onChange,
  loading,
  disabled,
  invalid,
  searchPlaceholder = 'Search',
  trailing,
}: ChoiceChipsProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const shown = useMemo(() => {
    const list = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
    // Keep the chosen chip visible even when the search hides it.
    const selected = options.find((o) => o.id === value)
    return selected && !list.includes(selected) ? [selected, ...list] : list
  }, [options, q, value])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    )
  }

  return (
    <div id={id} className="space-y-2.5">
      {options.length > SEARCH_FROM && (
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-body text-foreground outline-none transition-colors placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </label>
      )}

      <div
        role="radiogroup"
        aria-invalid={invalid}
        className={cn(
          'flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl p-0.5',
          invalid && 'ring-2 ring-destructive/40',
        )}
      >
        {shown.map((option) => {
          const active = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-caption font-semibold transition-all active:scale-95',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-surface text-foreground hover:border-primary/60',
              )}
            >
              {active && <Check className="size-3.5" aria-hidden />}
              {option.name}
            </button>
          )
        })}
        {q && shown.length === 0 && (
          <p className="px-1 py-2 text-caption text-text-muted">Nothing matches “{query.trim()}”.</p>
        )}
        {trailing}
      </div>
    </div>
  )
}
