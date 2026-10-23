import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Crosshair, Loader2, Map as MapIcon, MapPin, Phone } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/cn'
import { toast } from '@/utils/toast'
import { addressAt, currentPosition } from './addressLookup'
import { isValidPhone, type DeliveryDraft } from './deliveryDraft'

// Leaflet is only needed once someone opens the map — keep it out of the cart's bundle.
const MapPicker = lazy(() => import('./MapPicker'))

/**
 * Where to bring a home delivery and who to call: a typed address, filled in
 * from the device's location or a pin on the map, plus a mobile number.
 */
export function DeliveryDetails({ value, onChange }: { value: DeliveryDraft; onChange: (next: DeliveryDraft) => void }) {
  const [locating, setLocating] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const phoneError = phoneTouched && value.phone.length > 0 && !isValidPhone(value.phone)

  async function fillFromLocation() {
    setLocating(true)
    try {
      const point = await currentPosition()
      const found = await addressAt(point)
      onChange({ ...value, point, address: found ?? value.address })
      toast.success(found ? 'Location added — add your flat or landmark if needed.' : 'Location pinned. Please type your address too.')
    } catch (err) {
      toast.info(err instanceof Error ? err.message : 'Couldn’t get your location.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="overflow-hidden"
    >
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void fillFromLocation()}
            disabled={locating}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary-soft px-2 py-2.5 text-caption font-semibold text-primary transition-transform active:scale-[0.97] disabled:opacity-70"
          >
            {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
            Current location
          </button>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-2.5 text-caption font-semibold text-foreground transition-transform hover:bg-surface-muted active:scale-[0.97]"
          >
            <MapIcon className="size-4 text-primary" aria-hidden />
            Choose on map
          </button>
        </div>

        <AnimatePresence>
          {value.point && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-small font-semibold text-success"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Location pinned on the map</span>
              <button type="button" onClick={() => onChange({ ...value, point: null })} className="text-text-muted underline">
                Remove
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-caption font-medium text-foreground">
            <MapPin className="size-3.5 text-text-muted" aria-hidden /> Delivery address
          </span>
          <Textarea
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="House / flat no., building, street, landmark"
          />
        </label>

        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-caption font-medium text-foreground">
            <Phone className="size-3.5 text-text-muted" aria-hidden /> Mobile number
          </span>
          <div
            className={cn(
              'flex h-11 items-center overflow-hidden rounded-xl border bg-surface focus-within:border-primary',
              phoneError ? 'border-danger' : 'border-border',
            )}
          >
            <span className="border-r border-border px-3 text-body font-semibold text-text-secondary">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={() => setPhoneTouched(true)}
              placeholder="10-digit mobile number"
              aria-invalid={phoneError}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-body tracking-wide text-foreground outline-none"
            />
          </div>
          {phoneError ? (
            <span className="text-small text-danger">Enter a valid 10-digit mobile number.</span>
          ) : (
            <span className="text-small text-text-muted">The shop calls this number if they can’t find you.</span>
          )}
        </label>
      </div>

      {mapOpen && (
        <Suspense fallback={null}>
          <MapPicker
            open={mapOpen}
            onOpenChange={setMapOpen}
            initial={value.point}
            onConfirm={({ point, address }) => {
              // Keep what they typed if the lookup found nothing.
              onChange({ ...value, point, address: address ?? value.address })
            }}
          />
        </Suspense>
      )}
    </motion.div>
  )
}
