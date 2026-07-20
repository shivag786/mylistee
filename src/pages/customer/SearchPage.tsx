import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { TextField } from '@/components/forms/TextField'
import { EmptyState } from '@/components/feedback/EmptyState'
import { BusinessCard } from '@/features/businesses/components/BusinessCard'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { MESSAGES } from '@/constants/messages'

export function SearchPage() {
  const [term, setTerm] = useState('')
  const { data } = useNearbyBusinesses()

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.category?.toLowerCase().includes(q) ?? false) ||
        (b.area?.toLowerCase().includes(q) ?? false),
    )
  }, [term, data])

  return (
    <div className="space-y-4">
      <TextField
        label="Search"
        placeholder="Shops, cafés, offers, area…"
        leftIcon={<Search className="size-5" />}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        autoFocus
      />
      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-7" />}
          title={MESSAGES.empty.search.title}
          description={MESSAGES.empty.search.description}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  )
}
