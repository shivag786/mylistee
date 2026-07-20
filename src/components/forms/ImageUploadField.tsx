import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ImageUploadFieldProps {
  label: string
  /** Currently selected file (controlled). */
  value?: File | null
  /** Existing remote image URL to show when no new file is picked. */
  previewUrl?: string | null
  onChange: (file: File | null) => void
  aspect?: 'square' | 'cover'
  hint?: string
  error?: string
  disabled?: boolean
}

/**
 * Single-image picker with live preview (document/phase/07 §Media). Frames a
 * logo (square) or cover (16:9). Reused across registration and settings.
 */
export function ImageUploadField({
  label,
  value,
  previewUrl,
  onChange,
  aspect = 'square',
  hint,
  error,
  disabled,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setLocalPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setLocalPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const shown = localPreview ?? previewUrl ?? null

  return (
    <div className="space-y-1.5">
      <span className="text-caption font-medium text-foreground">{label}</span>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed border-border-strong bg-surface-muted',
          aspect === 'square' ? 'aspect-square max-w-40' : 'aspect-video w-full',
          error && 'border-destructive',
        )}
      >
        {shown ? (
          <img
            src={shown}
            alt={`${label} preview`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
          >
            <ImagePlus className="size-7" aria-hidden />
            <span className="text-small">Tap to upload</span>
          </button>
        )}

        {shown && !disabled && (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-dark/60 text-white backdrop-blur transition-colors hover:bg-dark/80"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {shown && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-small font-medium text-primary hover:underline"
        >
          Change image
        </button>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {error ? (
        <p className="text-small text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-small text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
