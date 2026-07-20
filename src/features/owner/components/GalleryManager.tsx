import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/feedback/Spinner'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useAddGalleryImage, useRemoveGalleryImage } from '../hooks/useOwner'
import type { GalleryImage } from '../types'

/**
 * Add/remove business gallery photos (document/phase/07 §Gallery). Uploads go
 * straight through the owner service; removals confirm first (irreversible).
 */
export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const add = useAddGalleryImage()
  const remove = useRemoveGalleryImage()
  const [pendingDelete, setPendingDelete] = useState<GalleryImage | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    try {
      for (const file of Array.from(files)) {
        await add.mutateAsync(file)
      }
      toast.success('Gallery updated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed. Please try again.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await remove.mutateAsync(pendingDelete.id)
      toast.success('Photo removed')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove the photo.')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
            {image.url && (
              <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />
            )}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setPendingDelete(image)}
              className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-dark/60 text-white opacity-0 backdrop-blur transition-opacity hover:bg-danger group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={add.isPending}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
        >
          {add.isPending ? <Spinner size={20} /> : <ImagePlus className="size-6" aria-hidden />}
          <span className="text-small">Add photo</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove this photo?"
        description="This will delete the photo from your gallery."
        confirmLabel="Remove"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
