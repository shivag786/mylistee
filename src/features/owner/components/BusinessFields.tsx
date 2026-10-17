import { useState } from 'react'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { CheckCircle2, Loader2, LocateFixed } from 'lucide-react'
import { TextField } from '@/components/forms/TextField'
import { Label } from '@/components/ui/label'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { reverseGeocodeAddress } from '@/features/location/geocodeService'
import type { BusinessSchema } from '../businessSchema'
import { CategorySelect } from './CategorySelect'

type Register = UseFormRegister<BusinessSchema>
type Errors = FieldErrors<BusinessSchema>
type SetValue = UseFormSetValue<BusinessSchema>
type Watch = UseFormWatch<BusinessSchema>

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
        <Label htmlFor="description">Description (optional)</Label>
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

/** Contact, location and hours (business profile). */
export function ContactLocationFields({
  register,
  errors,
  setValue,
  watch,
}: {
  register: Register
  errors: Errors
  setValue: SetValue
  watch: Watch
}) {
  return (
    <div className="space-y-4">
      <TextField label="Phone" inputMode="tel" placeholder="Mobile number" error={errors.phone?.message} {...register('phone')} />
      <TextField label="Email" type="email" placeholder="business@email.com" error={errors.email?.message} {...register('email')} />
      <TextField label="Website" placeholder="https://…" error={errors.website?.message} {...register('website')} />
      <ShopLocationField register={register} errors={errors} setValue={setValue} watch={watch} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Opens at" type="time" error={errors.openingTime?.message} {...register('openingTime')} />
        <TextField label="Closes at" type="time" error={errors.closingTime?.message} {...register('closingTime')} />
      </div>
    </div>
  )
}

/**
 * One tap fills the shop's map position, street address and city from where
 * the owner is standing. Coordinates are kept behind the scenes (they power
 * "nearby" sorting) — the owner only sees and corrects the address and city.
 */
export function ShopLocationField({
  register,
  errors,
  setValue,
  watch,
}: {
  register: Register
  errors: Errors
  setValue: SetValue
  watch: Watch
}) {
  const [locating, setLocating] = useState(false)
  const hasPin = Boolean(watch('latitude') && watch('longitude'))

  function getAddress() {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not supported on this device. Please type your address.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const opts = { shouldValidate: true, shouldDirty: true }
        setValue('latitude', coords.lat.toFixed(6), opts)
        setValue('longitude', coords.lng.toFixed(6), opts)
        reverseGeocodeAddress(coords)
          .then((place) => {
            if (place?.address) setValue('address', place.address, opts)
            if (place?.city) setValue('city', place.city, opts)
            if (place?.address || place?.city) toast.success('Shop address added')
            else toast.info('Location saved. Please type your address below.')
          })
          .catch(() => toast.info('Location saved. Please type your address below.'))
          .finally(() => setLocating(false))
      },
      () => {
        setLocating(false)
        toast.error("Couldn't get your location. Allow location access, or type your address.")
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={getAddress}
        disabled={locating}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors disabled:opacity-80',
          hasPin
            ? 'border-success/40 bg-success-soft'
            : 'border-dashed border-primary/50 bg-primary-soft hover:border-primary',
        )}
      >
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-soft',
            hasPin ? 'bg-success' : 'bg-primary',
          )}
        >
          {locating ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : hasPin ? (
            <CheckCircle2 className="size-5" aria-hidden />
          ) : (
            <LocateFixed className="size-5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-foreground">
            {locating ? 'Finding your shop…' : hasPin ? 'Shop location saved' : 'Get my shop address'}
          </span>
          <span className="block text-small text-text-secondary">
            {hasPin
              ? 'Tap again if you moved — address and city update too.'
              : 'Stand in your shop and tap. We fill the address and city for you.'}
          </span>
        </span>
      </button>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          rows={2}
          placeholder="Shop no., street, area"
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-body text-foreground outline-none transition-colors placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          {...register('address')}
        />
        {errors.address && <p className="text-caption text-destructive">{errors.address.message}</p>}
      </div>
      <TextField label="City" placeholder="e.g. Mumbai" error={errors.city?.message} {...register('city')} />
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
