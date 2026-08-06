import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useBannerActions } from '@/features/admin/hooks/useAdmin'
import type { AdminBanner, BannerInput, BannerPlacement } from '@/features/admin/types'

interface BannerFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = create; a banner = edit. */
  banner: AdminBanner | null
}

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'home_top', label: 'Top of home' },
  { value: 'home_after_combos', label: 'After combos' },
]

/**
 * Value for <input type="datetime-local">. The backend already returns a naive
 * wall-clock string ("YYYY-MM-DDTHH:mm"), so we use it as-is — no `new Date()`
 * timezone conversion, which is what caused the time to shift on edit.
 */
function toLocalInput(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : ''
}

export function BannerFormSheet({ open, onOpenChange, banner }: BannerFormSheetProps) {
  const { create, update } = useBannerActions()
  const editing = banner !== null
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [placement, setPlacement] = useState<BannerPlacement>('home_top')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(banner?.title ?? '')
    setLinkUrl(banner?.linkUrl ?? '')
    setPlacement(banner?.placement ?? 'home_top')
    setStartsAt(toLocalInput(banner?.startsAt))
    setEndsAt(toLocalInput(banner?.endsAt))
    setIsActive(banner?.isActive ?? true)
    setImage(null)
    setPreview(banner?.imageUrl ?? null)
    setError(null)
  }, [open, banner])

  function pickImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : (banner?.imageUrl ?? null))
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Give the banner a title.')
      return
    }
    if (!editing && !image) {
      setError('Please choose an image.')
      return
    }
    if (startsAt && endsAt && endsAt < startsAt) {
      setError('End time must be after the start time.')
      return
    }

    const input: BannerInput = {
      title: title.trim(),
      linkUrl: linkUrl.trim() || null,
      placement,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      isActive,
      image,
    }

    try {
      if (editing) await update.mutateAsync({ id: banner.id, input })
      else await create.mutateAsync(input)
      toast.success(editing ? 'Banner updated' : 'Banner created')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the banner.')
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{editing ? 'Edit banner' : 'New banner'}</SheetTitle>
          <SheetDescription>Shown on the home page. Leave dates empty to show it always.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* Image */}
          <div className="space-y-1.5">
            <Label>Banner image</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[16/6] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-muted"
            >
              {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-text-muted">
                  <ImagePlus className="size-6" aria-hidden />
                  <span className="text-caption">Tap to upload (wide image)</span>
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bn-title">Title</Label>
            <Input id="bn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali sale" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bn-link">Link (optional)</Label>
            <Input id="bn-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…  or  /deals" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bn-place">Show where?</Label>
            <Select value={placement} onValueChange={(v) => setPlacement(v as BannerPlacement)}>
              <SelectTrigger id="bn-place" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bn-start">Start</Label>
              <Input id="bn-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bn-end">End</Label>
              <Input id="bn-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
            <span>
              <span className="block text-caption font-semibold text-foreground">Active</span>
              <span className="block text-small text-text-muted">Turn off to hide without deleting.</span>
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>

          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button onClick={() => void handleSave()} isLoading={pending}>
            {editing ? 'Save changes' : 'Create banner'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
