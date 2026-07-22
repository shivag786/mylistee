import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageCropField } from '@/components/forms/ImageCropField'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { useCategoryActions } from '@/features/admin/hooks/useAdmin'
import type { AdminCategory, CategoryInput } from '@/features/admin/types'

interface CategoryFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Editing an existing category, or null to create a new one. */
  category: AdminCategory | null
}

/**
 * Create / edit a master category (Phase 7.1). Circle-cropped image via the
 * shared ImageCropField; slug + alt text default from the name server-side, so
 * the admin only fills what matters (07B — less typing).
 */
export function CategoryFormSheet({ open, onOpenChange, category }: CategoryFormSheetProps) {
  const { create, update } = useCategoryActions()
  const isEdit = category !== null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [showOnHomepage, setShowOnHomepage] = useState(true)
  const [showInSearch, setShowInSearch] = useState(true)
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync form state whenever the target category (or open) changes.
  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setDescription(category?.description ?? '')
    setIcon(category?.icon ?? '')
    setImage(null)
    setShowOnHomepage(category?.showOnHomepage ?? true)
    setShowInSearch(category?.showInSearch ?? true)
    setActive(category ? category.status === 'active' : true)
    setError(null)
  }, [open, category])

  const pending = create.isPending || update.isPending

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Category name is required.')
      return
    }
    const input: CategoryInput = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
      status: active ? 'active' : 'inactive',
      showOnHomepage,
      showInSearch,
      image,
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: category.id, input })
        toast.success('Category updated')
      } else {
        await create.mutateAsync(input)
        toast.success('Category created')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit category' : 'New category'}</SheetTitle>
          <SheetDescription>
            Categories are shown to customers across the app. Keep names short and clear.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <ImageCropField
            label="Category image"
            shape="circle"
            value={image}
            previewUrl={category?.imageUrl}
            onChange={setImage}
            hint="Square image, cropped to a circle."
          />

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food & Drinks"
              aria-invalid={Boolean(error)}
            />
            {error && <p className="text-caption text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-icon">Icon name (optional)</Label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="lucide icon, e.g. utensils"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this category"
              rows={3}
            />
          </div>

          <ToggleRow
            label="Active"
            description="Inactive categories are hidden everywhere."
            checked={active}
            onChange={setActive}
          />
          <ToggleRow
            label="Show on homepage"
            description="Feature this category on the customer home screen."
            checked={showOnHomepage}
            onChange={setShowOnHomepage}
          />
          <ToggleRow
            label="Show in search"
            description="Allow customers to filter by this category."
            checked={showInSearch}
            onChange={setShowInSearch}
          />
        </div>

        <SheetFooter className="border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} isLoading={pending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span className="space-y-0.5">
        <span className="block text-caption font-medium text-foreground">{label}</span>
        <span className="block text-small text-text-muted">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
