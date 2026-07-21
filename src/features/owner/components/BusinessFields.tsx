import { useState } from 'react'
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { LocateFixed } from 'lucide-react'
import { TextField } from '@/components/forms/TextField'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import type { BusinessSchema } from '../businessSchema'
import { CategorySelect } from './CategorySelect'

type Register = UseFormRegister<BusinessSchema>
type Errors = FieldErrors<BusinessSchema>
type SetValue = UseFormSetValue<BusinessSchema>

interface BasicsProps {
  register: Register
  errors: Errors
  category: string
  onCategoryChange: (value: string) => void
}

/** Step 1 — identity: name, category, description. */
export function BasicsFields({ register, errors, category, onCategoryChange }: BasicsProps) {
  return (
    <div className="space-y-4">
      <TextField
        label="Business name"
        placeholder="e.g. Chai Point"
        error={errors.name?.message}
        {...register('name')}
      />
      <CategorySelect value={category} onChange={onCategoryChange} error={errors.category?.message} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={4}
          placeholder="Tell customers what makes your business special."
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-body text-foreground outline-none transition-colors placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-caption text-destructive">{errors.description.message}</p>
        )}
      </div>
    </div>
  )
}

/** Step 2 — contact & location. */
export function ContactLocationFields({
  register,
  errors,
  setValue,
}: {
  register: Register
  errors: Errors
  setValue: SetValue
}) {
  const [locating, setLocating] = useState(false)

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not supported on this device.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude.toFixed(6), { shouldValidate: true, shouldDirty: true })
        setValue('longitude', pos.coords.longitude.toFixed(6), { shouldValidate: true, shouldDirty: true })
        setLocating(false)
        toast.success('Current location added')
      },
      () => {
        setLocating(false)
        toast.error("Couldn't get your location. Please enter it manually.")
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="space-y-4">
      <TextField label="Phone" inputMode="tel" placeholder="Mobile number" error={errors.phone?.message} {...register('phone')} />
      <TextField label="Email" type="email" placeholder="business@email.com" error={errors.email?.message} {...register('email')} />
      <TextField label="Website" placeholder="https://…" error={errors.website?.message} {...register('website')} />
      <TextField label="Address" placeholder="Street, area, city" error={errors.address?.message} {...register('address')} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-medium text-foreground">Map location</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={locating}
          leftIcon={<LocateFixed className="size-4" aria-hidden />}
          onClick={useCurrentLocation}
        >
          Use current location
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Latitude" inputMode="decimal" placeholder="e.g. 19.0760" error={errors.latitude?.message} {...register('latitude')} />
        <TextField label="Longitude" inputMode="decimal" placeholder="e.g. 72.8777" error={errors.longitude?.message} {...register('longitude')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Opens at" type="time" error={errors.openingTime?.message} {...register('openingTime')} />
        <TextField label="Closes at" type="time" error={errors.closingTime?.message} {...register('closingTime')} />
      </div>
    </div>
  )
}

/** Step 4 — social links & GST. */
export function SocialsFields({ register, errors }: { register: Register; errors: Errors }) {
  return (
    <div className="space-y-4">
      <TextField label="Facebook" placeholder="facebook.com/yourpage or @handle" error={errors.facebook?.message} {...register('facebook')} />
      <TextField label="Instagram" placeholder="instagram.com/yourpage or @handle" error={errors.instagram?.message} {...register('instagram')} />
      <TextField label="WhatsApp" inputMode="tel" placeholder="WhatsApp number" error={errors.whatsapp?.message} {...register('whatsapp')} />
      <TextField label="GST number (optional)" placeholder="GSTIN" error={errors.gst?.message} {...register('gst')} />
    </div>
  )
}
