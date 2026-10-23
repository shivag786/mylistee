import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Crosshair, Loader2, MapPin, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { toast } from '@/utils/toast'
import { addressAt, currentPosition, searchPlaces, type LatLng, type PlaceResult } from './addressLookup'

/** Where the map opens when we know nothing better: the middle of India. */
const FALLBACK_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 }

interface MapPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Start here (the last pin, or the customer's location). */
  initial?: LatLng | null
  onConfirm: (place: { point: LatLng; address: string | null }) => void
}

/**
 * Drop a pin for home delivery, Rapido-style: the pin stays in the middle and
 * the map moves under it. The pin lifts while dragging and drops when the map
 * settles, then the street address under it is looked up.
 *
 * OpenStreetMap tiles — no API key, no billing.
 */
export default function MapPicker({ open, onOpenChange, initial, onConfirm }: MapPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] max-h-none w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[640px] sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl sm:border"
      >
        <DialogTitle className="sr-only">Choose delivery location</DialogTitle>
        <DialogDescription className="sr-only">Move the map to put the pin on your door.</DialogDescription>
        {open && <PickerBody initial={initial} onClose={() => onOpenChange(false)} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}

function PickerBody({
  initial,
  onClose,
  onConfirm,
}: {
  initial?: LatLng | null
  onClose: () => void
  onConfirm: MapPickerProps['onConfirm']
}) {
  const reduce = useReducedMotion()
  const mapEl = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const lookup = useRef<AbortController | null>(null)

  const [center, setCenter] = useState<LatLng>(initial ?? FALLBACK_CENTER)
  const [dragging, setDragging] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [locating, setLocating] = useState(false)
  // A fallback centre is not a place anyone lives — don't let them confirm it.
  const [placed, setPlaced] = useState(Boolean(initial))

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)

  /** Look up the address under the pin; the latest move wins. */
  function resolve(point: LatLng) {
    lookup.current?.abort()
    const ctrl = new AbortController()
    lookup.current = ctrl
    setResolving(true)
    void addressAt(point, ctrl.signal).then((found) => {
      if (ctrl.signal.aborted) return
      setAddress(found)
      setResolving(false)
    })
  }

  function flyTo(point: LatLng, zoom = 17) {
    setPlaced(true)
    map.current?.flyTo([point.lat, point.lng], zoom, { duration: reduce ? 0 : 0.8 })
  }

  async function locate() {
    setLocating(true)
    try {
      flyTo(await currentPosition())
    } catch (err) {
      toast.info(err instanceof Error ? err.message : 'Couldn’t get your location.')
    } finally {
      setLocating(false)
    }
  }

  // Build the map once. The dialog animates in, so the size is settled after.
  useEffect(() => {
    if (!mapEl.current) return
    const start = initial ?? FALLBACK_CENTER
    const m = L.map(mapEl.current, {
      center: [start.lat, start.lng],
      zoom: initial ? 17 : 5,
      zoomControl: false,
      attributionControl: true,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m)

    m.on('movestart', () => setDragging(true))
    m.on('moveend', () => {
      const c = m.getCenter()
      const point = { lat: c.lat, lng: c.lng }
      setDragging(false)
      setCenter(point)
      resolve(point)
    })
    // Touching the map means the customer is placing the pin themselves.
    m.on('dragstart', () => setPlaced(true))

    map.current = m
    const settle = window.setTimeout(() => m.invalidateSize(), 250)
    const observer = new ResizeObserver(() => m.invalidateSize())
    observer.observe(mapEl.current)

    if (initial) resolve(initial)
    else void locate()

    return () => {
      window.clearTimeout(settle)
      observer.disconnect()
      lookup.current?.abort()
      m.remove()
      map.current = null
    }
    // Built once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search as they type, after a pause.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching(true)
      void searchPlaces(q, placed ? center : null, ctrl.signal).then((found) => {
        if (ctrl.signal.aborted) return
        setResults(found)
        setSearching(false)
      })
    }, 450)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
    // `center` only biases the search; it should not re-run it on every pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function pick(place: PlaceResult) {
    setQuery('')
    setResults([])
    setAddress(place.address)
    flyTo(place)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Top bar: back + search */}
      <div className="relative z-[1100] flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface-muted"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, street, landmark…"
            aria-label="Search for a place"
            className="h-10 w-full rounded-full border border-border bg-surface-muted pl-9 pr-9 text-body text-foreground outline-none focus:border-primary"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-text-muted hover:bg-surface"
            >
              {searching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <X className="size-4" aria-hidden />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute inset-x-3 top-full mt-1 max-h-72 overflow-y-auto rounded-2xl border border-border bg-surface py-1 shadow-lg"
            >
              {results.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-muted"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="line-clamp-2 text-caption text-foreground">{r.address}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* The map, with the pin fixed in its centre */}
      <div className="relative min-h-0 flex-1">
        <div ref={mapEl} className="absolute inset-0 z-0" />

        <div className="pointer-events-none absolute inset-0 z-[1000] grid place-items-center">
          {/* Lifted pin + its shadow on the ground. The pin's tip sits on the centre. */}
          <div className="relative -translate-y-[22px]">
            <motion.div
              animate={{ y: dragging ? -14 : 0, scale: dragging ? 1.06 : 1 }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 24 }}
              className="relative flex flex-col items-center"
            >
              <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-premium ring-4 ring-white/90">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="-mt-1 h-4 w-1 rounded-b-full bg-primary" />
            </motion.div>
            <motion.span
              animate={{ scale: dragging ? 0.6 : 1, opacity: dragging ? 0.25 : 0.45 }}
              className="absolute left-1/2 top-full block h-1.5 w-4 -translate-x-1/2 rounded-[50%] bg-black"
            />
            {/* A ripple each time the pin lands. */}
            {!dragging && placed && !reduce && (
              <motion.span
                key={`${center.lat.toFixed(5)},${center.lng.toFixed(5)}`}
                initial={{ scale: 0.3, opacity: 0.55 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute left-1/2 top-full block size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
              />
            )}
          </div>

          <AnimatePresence>
            {dragging && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[calc(50%-92px)] rounded-full bg-foreground px-3 py-1 text-small font-semibold text-background shadow"
              >
                Release to set pin
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => void locate()}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2.5 text-caption font-semibold text-primary shadow-lg active:scale-95"
        >
          {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
          Use current location
        </button>
      </div>

      {/* The address under the pin, and confirm */}
      <div className="relative z-[1100] space-y-3 rounded-t-3xl border-t border-border bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <p className="text-small font-semibold uppercase tracking-wide text-text-muted">Deliver to</p>
        <div className="flex min-h-[44px] items-start gap-2.5">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          {resolving || dragging ? (
            <div className="flex-1 space-y-1.5 pt-1" aria-label="Finding address">
              <div className="h-3 w-4/5 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-surface-muted" />
            </div>
          ) : (
            <motion.p
              key={address ?? 'none'}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('line-clamp-3 text-body', address ? 'text-foreground' : 'text-text-muted')}
            >
              {placed ? address ?? 'Pinned on the map — you can add flat & landmark next.' : 'Move the map to put the pin on your door.'}
            </motion.p>
          )}
        </div>
        <Button
          fullWidth
          size="lg"
          disabled={!placed || dragging}
          onClick={() => {
            onConfirm({ point: center, address })
            onClose()
          }}
        >
          Confirm location
        </Button>
      </div>
    </div>
  )
}
