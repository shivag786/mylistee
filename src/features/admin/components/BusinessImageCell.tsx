import { useRef } from 'react'
import { ImagePlus, Pencil } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/utils/cn'
import type { AdminBusiness } from '@/features/admin/types'

interface BusinessImageCellProps {
  business: AdminBusiness
  type: 'logo' | 'cover'
  onUpload: (id: string, type: 'logo' | 'cover', file: File) => void
  pending?: boolean
}

/**
 * Table cell for a business logo / banner: shows a small thumbnail when set (or
 * "NA" when not), plus a button to upload / replace the image inline.
 */
export function BusinessImageCell({ business, type, onUpload, pending }: BusinessImageCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const url = type === 'logo' ? business.logoUrl : business.coverUrl
  const label = type === 'logo' ? 'logo' : 'banner'

  function pick(file: File | undefined) {
    if (file) onUpload(business.id, type, file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      {url ? (
        <img
          src={url}
          alt={`${business.name} ${label}`}
          className={cn(
            'shrink-0 border border-border object-cover',
            type === 'logo' ? 'size-9 rounded-lg' : 'h-9 w-16 rounded-md',
          )}
        />
      ) : (
        <span className="text-small font-medium text-text-muted">NA</span>
      )}

      <IconButton
        aria-label={`${url ? 'Change' : 'Upload'} ${label}`}
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {url ? <Pencil className="size-4" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
      </IconButton>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  )
}
