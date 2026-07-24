import { ImageOff, MapPin, Phone, Globe, Star, Clock, Tag, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ImportPreview } from '@/features/admin/types'

interface ImportPreviewCardProps {
  preview: ImportPreview
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small font-medium text-text-muted">{label}</dt>
      <dd className="truncate text-body text-foreground">{value ?? <span className="text-text-muted">—</span>}</dd>
    </div>
  )
}

function PreviewImage({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-surface-muted text-text-muted">
        <ImageOff className="size-6" aria-hidden />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={label}
      loading="lazy"
      className="aspect-video w-full rounded-xl object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

/** SPEC-011 §PREVIEW SCREEN — read-only display of everything collected. */
export function ImportPreviewCard({ preview }: ImportPreviewCardProps) {
  const hours = preview.openingHours?.weekdayDescriptions ?? []

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-subtitle font-semibold text-foreground">
            <Building2 className="size-5 text-primary" aria-hidden />
            <span className="truncate">{preview.name ?? 'Unknown business'}</span>
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-caption text-text-secondary">
            <Tag className="size-3.5" aria-hidden /> {preview.category ?? 'Uncategorized'}
          </p>
        </div>
        {preview.rating != null && (
          <Badge tone="info" className="shrink-0">
            <Star className="size-3.5" aria-hidden /> {preview.rating}
            {preview.reviewCount != null && <span className="opacity-80">({preview.reviewCount})</span>}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PreviewImage url={preview.primaryImageUrl} label="Primary image" />
        <PreviewImage url={preview.secondaryImageUrl} label="Secondary image" />
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Business Name" value={preview.name} />
        <Field label="Phone" value={preview.phone} />
        <Field
          label="Website"
          value={
            preview.website ? (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3.5 text-text-muted" aria-hidden />
                {preview.website}
              </span>
            ) : null
          }
        />
        <Field
          label="Address"
          value={
            preview.address ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-text-muted" aria-hidden />
                {preview.address}
              </span>
            ) : null
          }
        />
        <Field label="Google Rating" value={preview.rating} />
        <Field label="Review Count" value={preview.reviewCount} />
        <Field label="Latitude" value={preview.latitude} />
        <Field label="Longitude" value={preview.longitude} />
        <Field label="Business Status" value={preview.businessStatus} />
        <Field label="Google Place ID" value={<span className="font-mono text-caption">{preview.placeId}</span>} />
      </dl>

      {hours.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-small font-medium text-text-muted">
            <Clock className="size-3.5" aria-hidden /> Opening Hours
          </p>
          <ul className="grid grid-cols-1 gap-0.5 text-caption text-text-secondary sm:grid-cols-2">
            {hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-small text-text-muted">
        <Phone className="size-3.5" aria-hidden />
        Images are linked by URL only — Google files are never downloaded or stored.
      </div>
    </Card>
  )
}
