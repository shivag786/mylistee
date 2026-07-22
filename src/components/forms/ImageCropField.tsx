import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { ImagePlus, X, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCroppedImageFile } from '@/utils/cropImage'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'

interface ImageCropFieldProps {
  label: string
  /** Currently selected (already cropped) file. */
  value?: File | null
  /** Existing remote image URL to show when no new file is picked. */
  previewUrl?: string | null
  onChange: (file: File | null) => void
  /** Circle preview (categories, avatars) or rectangle (covers, product shots). */
  shape?: 'circle' | 'rect'
  /** Crop aspect ratio (width / height). Defaults to 1 (square). */
  aspect?: number
  hint?: string
  error?: string
  disabled?: boolean
}

/**
 * Reusable image picker with crop (Phase 7.0). Upload → adjust in a crop modal →
 * save a cropped File. `shape="circle"` shows a circular mask + preview (used by
 * category management); `shape="rect"` crops to `aspect`. The cropped File flows
 * out via `onChange` and is uploaded through the existing FormData path.
 */
export function ImageCropField({
  label,
  value,
  previewUrl,
  onChange,
  shape = 'circle',
  aspect = 1,
  hint,
  error,
  disabled,
}: ImageCropFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const [preview, setPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  // Live preview of the selected file (revoked on change to avoid leaks).
  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const shown = preview ?? previewUrl ?? null
  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  function pickFile(file: File | undefined) {
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onCropComplete = useCallback((_area: Area, areaInPixels: Area) => {
    setAreaPixels(areaInPixels)
  }, [])

  async function handleSave() {
    if (!cropSrc || !areaPixels) return
    setSaving(true)
    try {
      const file = await getCroppedImageFile(cropSrc, areaPixels, `${label}.jpg`)
      onChange(file)
      closeModal()
    } catch {
      toast.error('Could not crop the image. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function closeModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setAreaPixels(null)
  }

  return (
    <div className="space-y-1.5">
      <span className="text-caption font-medium text-foreground">{label}</span>

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative grid size-24 shrink-0 place-items-center overflow-hidden border-2 border-dashed border-border-strong bg-surface-muted',
            rounded,
            error && 'border-destructive',
          )}
        >
          {shown ? (
            <img src={shown} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-7 text-text-muted" aria-hidden />
          )}
          {shown && !disabled && (
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-dark/60 text-white backdrop-blur transition-colors hover:bg-dark/80"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {shown ? 'Change image' : 'Upload image'}
          </Button>
          {hint && <p className="text-small text-text-muted">{hint}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      {error && <p className="text-small text-destructive">{error}</p>}

      <Dialog open={cropSrc !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop image</DialogTitle>
          </DialogHeader>

          <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-dark">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={shape === 'circle' ? 'round' : 'rect'}
                showGrid={shape === 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
            <ZoomIn className="size-4 shrink-0 text-text-secondary" aria-hidden />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-strong accent-primary"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} isLoading={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
