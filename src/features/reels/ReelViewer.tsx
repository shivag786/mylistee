import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp, Heart, Navigation, ShoppingBag, Volume2, VolumeX, X } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatDistance } from '@/utils/format'
import { PhotoReel } from './PhotoReel'
import { playExclusive, releaseVideo } from './reelMedia'
import { reelService, type ShopReel } from './reelService'

/**
 * Full-screen reels: swipe up for the next, down for the previous. Videos start
 * muted (browsers require it) with a tap-to-unmute; each reel offers its dish
 * and a way into the shop.
 */
export function ReelViewer({ reels, openAt, onClose }: { reels: ShopReel[]; openAt: number | null; onClose: () => void }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const open = openAt !== null && reels.length > 0
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reel = reels[Math.min(index, reels.length - 1)]

  useEffect(() => {
    if (openAt !== null) setIndex(openAt)
  }, [openAt])

  // Play the current video, count the view.
  useEffect(() => {
    if (!open || !reel) return
    void reelService.view(reel.id)
    const video = videoRef.current
    if (video) playExclusive(video)
    return () => {
      if (video) releaseVideo(video)
    }
  }, [open, reel])

  function go(step: number) {
    const next = index + step
    if (next < 0 || next >= reels.length) return
    setDir(step)
    setIndex(next)
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -70 || info.velocity.y < -450) go(1)
    else if (info.offset.y > 70 || info.velocity.y > 450) {
      if (index === 0) onClose()
      else go(-1)
    }
  }

  function visit(withDish: boolean) {
    if (!reel?.business) return
    const url = ROUTES.businessProfile(reel.business.slug)
    onClose()
    navigate(withDish && reel.dish ? `${url}?item=${reel.dish.id}` : url)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 overflow-hidden bg-black text-white outline-none select-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          // Focus the viewer itself, not its first button (which would show a focus ring on open).
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">{reel?.caption ?? 'Reel'}</DialogPrimitive.Title>

          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            {reel && (
              <motion.div
                key={reel.id}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ y: reduce ? 0 : `${d * 100}%`, opacity: reduce ? 0 : 1 }),
                  center: { y: '0%', opacity: 1 },
                  exit: (d: number) => ({ y: reduce ? 0 : `${d * -100}%`, opacity: reduce ? 0 : 1 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 260, damping: 32 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.35}
                onDragEnd={onDragEnd}
                className="absolute inset-0"
              >
                {reel.type === 'video' && reel.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={reel.videoUrl}
                    poster={reel.posterUrl ?? undefined}
                    muted={muted}
                    loop
                    playsInline
                    autoPlay
                    onClick={() => setMuted((m) => !m)}
                    className="absolute inset-0 size-full object-contain"
                  />
                ) : (
                  <PhotoReel photos={reel.photoUrls} playing className="absolute inset-0" />
                )}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />

                {/* Bottom: shop, caption, dish, actions */}
                <div className="absolute inset-x-0 bottom-0 space-y-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  {reel.business && (
                    <button type="button" onClick={() => visit(false)} className="flex items-center gap-2 text-left">
                      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white/60">
                        {reel.business.logoUrl ? (
                          <img src={reel.business.logoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="font-black text-primary">{reel.business.name.charAt(0)}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-caption font-bold">{reel.business.name}</span>
                        <span className="flex items-center gap-2 text-small text-white/75">
                          {reel.business.isFollowed && (
                            <span className="inline-flex items-center gap-0.5"><Heart className="size-3 fill-current" aria-hidden /> Following</span>
                          )}
                          {reel.business.distanceMeters != null && (
                            <span className="inline-flex items-center gap-0.5"><Navigation className="size-3" aria-hidden /> {formatDistance(reel.business.distanceMeters)}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  )}

                  {reel.caption && <p className="text-body font-medium leading-snug">{reel.caption}</p>}

                  {reel.dish && (
                    <motion.button
                      type="button"
                      onClick={() => visit(true)}
                      initial={reduce ? false : { y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 240, damping: 20 }}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/12 p-2 text-left ring-1 ring-white/20 backdrop-blur-xl"
                    >
                      {reel.dish.imageUrl && <img src={reel.dish.imageUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-caption font-semibold">{reel.dish.name}</span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-body font-black">₹{reel.dish.price}</span>
                          {reel.dish.strikePrice != null && <span className="text-small text-white/55 line-through">₹{reel.dish.strikePrice}</span>}
                        </span>
                      </span>
                      <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-caption font-bold text-primary-foreground">
                        <ShoppingBag className="size-4" aria-hidden /> Order
                      </span>
                    </motion.button>
                  )}

                  {reel.business && !reel.dish && (
                    <button
                      type="button"
                      onClick={() => visit(false)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-body font-bold text-primary-foreground"
                    >
                      Visit {reel.business.name} <ArrowRight className="size-5" aria-hidden />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {reel?.type === 'video' ? (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="grid size-10 place-items-center rounded-full bg-black/35 backdrop-blur"
                aria-label={muted ? 'Turn sound on' : 'Mute'}
              >
                {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
              </button>
            ) : (
              <span />
            )}
            <span className="rounded-full bg-black/35 px-3 py-1 text-small backdrop-blur">
              {index + 1} / {reels.length}
            </span>
            <DialogPrimitive.Close className="grid size-10 place-items-center rounded-full bg-black/35 backdrop-blur" aria-label="Close">
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          {/* Desktop: up/down */}
          <div className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
            <button type="button" onClick={() => go(-1)} disabled={index === 0} className="grid size-11 place-items-center rounded-full bg-black/35 backdrop-blur disabled:opacity-30" aria-label="Previous reel">
              <ChevronUp className="size-6" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} disabled={index >= reels.length - 1} className="grid size-11 place-items-center rounded-full bg-black/35 backdrop-blur disabled:opacity-30" aria-label="Next reel">
              <ChevronDown className="size-6" aria-hidden />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
