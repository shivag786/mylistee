import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '../hooks/useOwner'

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

/** Category picker backed by the public /categories endpoint. */
export function CategorySelect({ value, onChange, error, disabled }: CategorySelectProps) {
  const { data: categories, isLoading } = useCategories()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="category">Business category</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger id="category" aria-invalid={Boolean(error)} className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading categories…' : 'Choose a category'} />
        </SelectTrigger>
        <SelectContent>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}
