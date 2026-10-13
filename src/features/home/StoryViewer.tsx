import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { ArrowRight, Gift, Heart, Layers, Navigation, Sparkles, Tag, X } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatDistance } from '@/utils/format'
import type { ShopStory, StoryKind } from './homeService'

/** How long one shop's story shows before moving on. */
const STORY_MS = 6000

const KIND_ICON: Record<StoryKind, typeof Tag> = { deal: Tag, spin: Gift, special: Sparkles, combo: Layers }

/**
 * Full-screen shop stories, Instagram-style: a progress bar per shop that fills
 * and moves on by itself; tap the right side for next, left for previous, hold
 * to pause, swipe down to close. Each story shows the shop's headline and a few
 * dishes, with a button through to the shop.
 */
export function StoryViewer({
  stories,
  openAt,
  onClose,
  onView,
}: {
  stories: ShopStory[]
  openAt: number | null
  onClose: () => void
  onView: (story: ShopStory) => void
}) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const open = openAt !== null && stories.length > 0
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  // A long press pauses; letting go after one must not also skip the story.
  const pressedAt = useRef(0)
  const press = () => {
    pressedAt.current = Date.now()
    setHeld(true)
  }
  const wasTap = () => Date.now() - pressedAt.current < 250
  const story = stories[Math.min(index, stories.length - 1)]

  useEffect(() => {
    if (openAt !== null) setIndex(openAt)
  }, [openAt])

  useEffect(() => {
    if (open && story) onView(story)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, story?.slug])

  function next() {
    if (index >= stories.length - 1) onClose()
    else setIndex((i) => i + 1)
  }

  // Fill the current bar; holding a finger down pauses it where it is.
  const [progress, setProgress] = useState(0)
  useEffect(() => setProgress(0), [index, open])
  useEffect(() => {
    if (!open || held) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const step = (now - last) / STORY_MS
      last = now
      setProgress((p) => Math.min(1, p + step))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, held, index])
  useEffect(() => {
    if (progress >= 1) next()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  function prev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 90 || info.velocity.y > 500) onClose()
  }

  const background = story?.coverUrl ?? story?.items[0]?.imageUrl ?? story?.logoUrl
  const Icon = story?.kind ? KIND_ICON[story.kind] : Sparkles

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 overflow-hidden bg-neutral-950 text-white outline-none select-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          // Focus the viewer itself, not its first button (which would show a focus ring on open).
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">{story?.name ?? 'Story'}</DialogPrimitive.Title>

          {story && (
            <motion.div
              className="absolute inset-0"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={onDragEnd}
            >
              {/* Backdrop */}
              <AnimatePresence initial={false}>
                {background && (
                  <motion.img
                    key={story.slug}
                    src={background}
                    alt=""
                    aria-hidden
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 1, scale: 1.05 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="pointer-events-none absolute inset-0 size-full object-cover blur-2xl saturate-150"
                  />
                )}
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/85" />

              {/* Progress */}
              <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                {stories.map((s, i) => (
                  <span key={s.slug} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                    <span
                      className="block h-full bg-white"
                      style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }}
                    />
                  </span>
                ))}
              </div>

              {/* Shop header */}
              <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2.5 px-3 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))]">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white/60">
                  {story.logoUrl ? (
                    <img src={story.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="font-black text-primary">{story.name.charAt(0)}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-bold">{story.name}</p>
                  <p className="flex items-center gap-2 text-small text-white/75">
                    {story.isFollowed && (
                      <span className="inline-flex items-center gap-0.5"><Heart className="size-3 fill-current" aria-hidden /> Following</span>
                    )}
                    {story.distanceMeters != null && (
                      <span className="inline-flex items-center gap-0.5"><Navigation className="size-3" aria-hidden /> {formatDistance(story.distanceMeters)}</span>
                    )}
                  </p>
                </div>
                <DialogPrimitive.Close className="grid size-9 place-items-center rounded-full bg-black/30 backdrop-blur" aria-label="Close">
                  <X className="size-5" aria-hidden />
                </DialogPrimitive.Close>
              </div>

              {/* Tap zones: left = previous, right = next, hold = pause */}
              <button
                type="button"
                aria-label="Previous shop"
                className="absolute inset-y-0 left-0 z-10 w-1/3"
                onClick={() => wasTap() && prev()}
                onPointerDown={press}
                onPointerUp={() => setHeld(false)}
                onPointerLeave={() => setHeld(false)}
              />
              <button
                type="button"
                aria-label="Next shop"
                className="absolute inset-y-0 right-0 z-10 w-2/3"
                onClick={() => wasTap() && next()}
                onPointerDown={press}
                onPointerUp={() => setHeld(false)}
                onPointerLeave={() => setHeld(false)}
              />

              {/* Content */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={story.slug}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 top-24 z-10 flex flex-col justify-end gap-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                >
                  {story.headline && (
                    <motion.div
                      initial={reduce ? false : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
                      className="inline-flex items-center gap-2 self-start rounded-2xl bg-white px-4 py-2.5 text-body-lg font-black text-neutral-900 shadow-2xl"
                    >
                      <Icon className="size-5 text-primary" aria-hidden />
                      {story.headline}
                    </motion.div>
                  )}

                  {story.items.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {story.items.map((dish, i) => (
                        <motion.div
                          key={dish.id}
                          initial={reduce ? false : { opacity: 0, y: 20, rotate: i % 2 ? 3 : -3 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 + i * 0.08 }}
                          className="overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md"
                        >
                          {dish.imageUrl && <img src={dish.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />}
                          <div className="p-2">
                            <p className="line-clamp-1 text-caption font-semibold">{dish.name}</p>
                            <p className="flex items-baseline gap-1.5">
                              <span className="text-body font-black">₹{dish.price}</span>
                              {dish.strikePrice != null && <span className="text-small text-white/55 line-through">₹{dish.strikePrice}</span>}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(ROUTES.businessProfile(story.slug))
                    }}
                    className="pointer-events-auto relative z-20 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-body font-bold text-primary-foreground shadow-2xl"
                  >
                    Visit {story.name} <ArrowRight className="size-5" aria-hidden />
                  </button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
