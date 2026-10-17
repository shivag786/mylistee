import { Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { useProductCategories } from '../hooks/useProducts'
import { ChoiceChips } from './ChoiceChips'

export interface MenuSectionValue {
  /** uuid of an existing section, or null. */
  id: string | null
  /** name of a new section to create on the fly, or null. */
  name: string | null
}

interface ProductCategorySelectProps {
  value: MenuSectionValue
  onChange: (value: MenuSectionValue) => void
  disabled?: boolean
}

/**
 * Menu-section picker (Phase 7.2) as chips: tap an existing section, or
 * "+ New section" to type one — the new name is sent with the product and the
 * backend find-or-creates it. Optional: a product can sit outside any section.
 */
export function ProductCategorySelect({ value, onChange, disabled }: ProductCategorySelectProps) {
  const { data: categories, isLoading } = useProductCategories()
  const creating = value.name !== null

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="menu-section">
        Menu section <span className="font-normal text-text-muted">(optional)</span>
      </Label>
      <ChoiceChips
        id="menu-section"
        options={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        value={creating ? null : value.id}
        // Tapping the chosen chip again clears it.
        onChange={(id) => onChange({ id: id === value.id ? null : id, name: null })}
        loading={isLoading}
        disabled={disabled}
        searchPlaceholder="Search sections"
        trailing={
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(creating ? { id: null, name: null } : { id: null, name: '' })}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-dashed px-3.5 py-2 text-caption font-semibold transition-colors',
              creating
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border-strong text-text-secondary hover:border-primary hover:text-primary',
            )}
          >
            <Plus className="size-3.5" aria-hidden />
            New section
          </button>
        }
      />

      {creating && (
        <Input
          autoFocus
          value={value.name ?? ''}
          onChange={(e) => onChange({ id: null, name: e.target.value })}
          placeholder="e.g. Burgers, Shakes, Thali"
          aria-label="New section name"
        />
      )}
    </div>
  )
}
