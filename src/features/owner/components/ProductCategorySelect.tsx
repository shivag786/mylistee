import { useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProductCategories } from '../hooks/useProducts'

const NEW = '__new__'

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
 * Menu-section picker (Phase 7.2). Pick an existing section or create one on the
 * fly — the new name is sent with the product and the backend find-or-creates it.
 */
export function ProductCategorySelect({ value, onChange, disabled }: ProductCategorySelectProps) {
  const { data: categories, isLoading } = useProductCategories()
  const newInputRef = useRef<HTMLInputElement>(null)

  const creating = value.name !== null
  const selectValue = creating ? NEW : (value.id ?? '')

  // Radix Select restores focus to its trigger when the menu closes, which steals
  // the input's `autoFocus`. Re-focus on the next frame once "New section" is chosen.
  useEffect(() => {
    if (!creating) return
    const id = requestAnimationFrame(() => newInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [creating])

  function handleSelect(next: string) {
    if (next === NEW) {
      onChange({ id: null, name: '' })
    } else {
      onChange({ id: next, name: null })
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="menu-section">Menu section</Label>
      <Select value={selectValue} onValueChange={handleSelect} disabled={disabled || isLoading}>
        <SelectTrigger id="menu-section" className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading…' : 'Choose a section'} />
        </SelectTrigger>
        <SelectContent>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
          {categories && categories.length > 0 && <SelectSeparator />}
          <SelectItem value={NEW}>+ New section…</SelectItem>
        </SelectContent>
      </Select>

      {creating && (
        <Input
          ref={newInputRef}
          autoFocus
          value={value.name ?? ''}
          onChange={(e) => onChange({ id: null, name: e.target.value })}
          placeholder="e.g. Burgers"
          aria-label="New section name"
        />
      )}
    </div>
  )
}
