import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface StatusOption {
  value: string
  label: string
}

interface AdminToolbarProps {
  search: string
  onSearch: (value: string) => void
  placeholder?: string
  statusOptions?: StatusOption[]
  status?: string
  onStatus?: (value: string) => void
}

/** Search box (debounced) + optional status filter, shown above an admin table. */
export function AdminToolbar({
  search,
  onSearch,
  placeholder = 'Search…',
  statusOptions,
  status,
  onStatus,
}: AdminToolbarProps) {
  const [value, setValue] = useState(search)

  useEffect(() => {
    const id = setTimeout(() => onSearch(value.trim()), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label="Search"
        />
      </div>
      {statusOptions && onStatus && (
        <select
          value={status ?? ''}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Filter by status"
          className="h-[52px] rounded-input border border-border bg-surface px-3 text-caption text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
