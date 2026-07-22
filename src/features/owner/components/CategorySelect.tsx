import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageCropField } from '@/components/forms/ImageCropField'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { useCategories, useRequestCategory } from '../hooks/useOwner'

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

/**
 * Category picker backed by the public /categories endpoint. When no category
 * fits, the owner can request a new one for admin approval (Phase 7.1).
 */
export function CategorySelect({ value, onChange, error, disabled }: CategorySelectProps) {
  const { data: categories, isLoading } = useCategories()
  const requestCategory = useRequestCategory()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [sample, setSample] = useState<File | null>(null)

  async function submitRequest() {
    if (!name.trim()) return
    try {
      await requestCategory.mutateAsync({ name: name.trim(), sampleImage: sample })
      toast.success('Request sent', "We'll review your category shortly.")
      setOpen(false)
      setName('')
      setSample(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="category">Business category</Label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-small font-medium text-primary hover:underline"
        >
          <Plus className="size-3.5" aria-hidden /> Request new
        </button>
      </div>

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request a new category</DialogTitle>
            <DialogDescription>
              Can't find your category? Tell us and we'll add it after a quick review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="request-name">Category name</Label>
              <Input
                id="request-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pet Grooming"
              />
            </div>
            <ImageCropField
              label="Sample image (optional)"
              shape="rect"
              aspect={16 / 9}
              value={sample}
              onChange={setSample}
              hint="Helps us understand the category."
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={requestCategory.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitRequest()}
              isLoading={requestCategory.isPending}
              disabled={!name.trim()}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
