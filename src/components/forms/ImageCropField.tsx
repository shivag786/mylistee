import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Cropper, { type Area, type MediaSize, type Size } from 'react-easy-crop'
import { Camera, ImagePlus, Maximize2, RefreshCw, X, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCroppedImageFile, type CropOutputOptions } from '@/utils/cropImage'
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
  /**
   * `tile` is the small square beside an upload button; `hero` is a
   * full-width tap-to-add photo box at the crop's aspect ratio (product photos).
   */
  variant?: 'tile' | 'hero'
  /** Output size/quality — e.g. product photos are kept to ~1200px. */
  output?: CropOutputOptions
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
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
  variant = 'tile',
  output,
}: ImageCropFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const [preview, setPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  // Zoom at which the whole image fits inside the frame (contain). Lets owners
  // keep the entire photo instead of being forced to crop off the edges.
  const [fitZoom, setFitZoom] = useState(1)
  // The photo's natural size and the crop frame (screen px): with the photo
  // drawn to cover the box at zoom 1, the fit zoom is how far it must shrink
  // to sit wholly inside the frame.
  const boxRef = useRef<HTMLDivElement>(null)
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null)
  const [cropSize, setCropSize] = useState<Size | null>(null)

  const minZoom = Math.min(fitZoom, 1)

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
    setFitZoom(1)
    setMediaSize(null)
    setCropSize(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onCropComplete = useCallback((_area: Area, areaInPixels: Area) => {
    setAreaPixels(areaInPixels)
  }, [])

  useEffect(() => {
    const box = boxRef.current
    if (!mediaSize || !cropSize || !box) return
    const { naturalWidth: w, naturalHeight: h } = mediaSize
    const cover = Math.max(box.clientWidth / w, box.clientHeight / h)
    const fit = Math.min(cropSize.width / (w * cover), cropSize.height / (h * cover))
    setFitZoom(fit < 1 ? fit : 1)
  }, [mediaSize, cropSize])

  function fitWholeImage() {
    setZoom(minZoom)
    setCrop({ x: 0, y: 0 })
  }

  async function handleSave() {
    if (!cropSrc || !areaPixels) return
    setSaving(true)
    try {
      const file = await getCroppedImageFile(
        cropSrc,
        areaPixels,
        `${label}.jpg`,
        'image/jpeg',
        '#ffffff',
        output,
      )
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

      {variant === 'hero' ? (
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-2xl border-2 border-dashed bg-surface-muted',
            shown ? 'border-transparent' : 'border-primary/40',
            error && 'border-destructive',
          )}
          style={{ aspectRatio: String(aspect) }}
        >
          {shown ? (
            <>
              <img src={shown} alt={`${label} preview`} className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                {value ? (
                  <span className="rounded-full bg-black/40 px-2.5 py-1 text-small font-medium text-white backdrop-blur">
                    Ready · {formatBytes(value.size)}
                  </span>
                ) : (
                  <span />
                )}
                {!disabled && (
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-small font-semibold text-foreground shadow-soft"
                    >
                      <RefreshCw className="size-3.5" aria-hidden />
                      Change
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      onClick={() => onChange(null)}
                      className="grid size-8 place-items-center rounded-full bg-white text-danger shadow-soft"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </span>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-soft/70 to-surface-muted px-4 text-center transition-colors hover:from-primary-soft"
            >
              <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-premium">
                <Camera className="size-6" aria-hidden />
              </span>
              <span className="text-body font-bold text-foreground">Add a photo</span>
              {hint && <span className="text-small text-text-secondary">{hint}</span>}
            </button>
          )}
        </div>
      ) : (
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
      )}

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
        {/* No zoom-in animation here: the cropper measures its box as it mounts,
            and a box mid-scale-up gives a frame that doesn't match the photo. */}
        <DialogContent className="max-w-md data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100">
          <DialogHeader>
            <DialogTitle>Adjust photo</DialogTitle>
            <p className="text-small text-text-secondary">Drag to move, pinch or slide to zoom.</p>
          </DialogHeader>

          <div ref={boxRef} className="relative h-72 w-full overflow-hidden rounded-2xl bg-dark sm:h-80">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={3}
                objectFit="cover"
                // Zoomed out to keep the whole photo, it may float inside the
                // frame; otherwise the photo always fills the frame edge to edge.
                restrictPosition={zoom >= 1}
                aspect={aspect}
                cropShape={shape === 'circle' ? 'round' : 'rect'}
                showGrid={shape === 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={setMediaSize}
                onCropSizeChange={setCropSize}
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
            <ZoomIn className="size-4 shrink-0 text-text-secondary" aria-hidden />
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-strong accent-primary"
            />
            {fitZoom < 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={fitWholeImage}
              >
                <Maximize2 className="size-4" aria-hidden />
                Fit
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} isLoading={saving}>
              Use photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
