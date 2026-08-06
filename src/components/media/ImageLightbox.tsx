import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface LightboxImage {
  url: string
  label?: string | null
}

interface ImageLightboxProps {
  images: LightboxImage[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Which image to show first. */
  startIndex?: number
  /** Accessible title for the viewer (announced, visually hidden). */
  title?: string
}

/**
 * Full-screen image viewer. A single image is shown centered; multiple images
 * (e.g. a combo's contents) become a swipeable slider with arrows + dots.
 * Built on the Radix Dialog primitive for focus-trap, ESC and overlay-close.
 */
export function ImageLightbox({ images, open, onOpenChange, startIndex = 0, title = 'Image' }: ImageLightboxProps) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(startIndex)
  const [dir, setDir] = useState(0)
  const many = images.length > 1

  // Reset to the tapped image each time the viewer opens.
  useEffect(() => {
    if (open) setIndex(Math.min(Math.max(startIndex, 0), images.length - 1))
  }, [open, startIndex, images.length])

  function go(next: number) {
    if (!many) return
    const wrapped = (next + images.length) % images.length
    setDir(next > index ? 1 : -1)
    setIndex(wrapped)
  }

  // Arrow-key navigation.
  useEffect(() => {
    if (!open || !many) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, many, index])

  if (images.length === 0) return null
  const current = images[index]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none select-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          {/* Close */}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>

          <div className="relative flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4">
            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.img
                  key={current.url + index}
                  src={current.url}
                  alt={current.label ?? ''}
                  custom={dir}
                  drag={many ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) go(index + 1)
                    else if (info.offset.x > 80) go(index - 1)
                  }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-[75vh] max-w-full cursor-grab rounded-2xl object-contain shadow-2xl active:cursor-grabbing"
                />
              </AnimatePresence>

              {many && (
                <>
                  <NavButton side="left" onClick={() => go(index - 1)} />
                  <NavButton side="right" onClick={() => go(index + 1)} />
                </>
              )}
            </div>

            {current.label && (
              <p className="max-w-full truncate text-center text-body font-medium text-white/90">{current.label}</p>
            )}

            {many && (
              <div className="flex items-center gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={img.url + i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => go(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={cn(
        'absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
        side === 'left' ? 'left-1 sm:left-2' : 'right-1 sm:right-2',
      )}
    >
      {side === 'left' ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
    </button>
  )
}
