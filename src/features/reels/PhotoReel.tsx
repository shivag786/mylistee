import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

/** Seconds each photo holds before the next crossfades in. */
const PHOTO_SECONDS = 2.8

/** Alternating slow zoom/pan directions, so consecutive photos feel different. */
const MOTIONS = [
  { from: { scale: 1.05, x: '-2%', y: '0%' }, to: { scale: 1.2, x: '2%', y: '-2%' } },
  { from: { scale: 1.2, x: '2%', y: '2%' }, to: { scale: 1.05, x: '-2%', y: '0%' } },
  { from: { scale: 1.1, x: '0%', y: '-3%' }, to: { scale: 1.22, x: '0%', y: '2%' } },
]

/**
 * A few photos played as a reel: each slowly zooms and pans (Ken Burns), then
 * crossfades to the next. Paused shows the first photo, still.
 */
export function PhotoReel({ photos, playing, className }: { photos: string[]; playing: boolean; className?: string }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!playing || photos.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), PHOTO_SECONDS * 1000)
    return () => clearInterval(t)
  }, [playing, photos.length])

  useEffect(() => {
    if (!playing) setIndex(0)
  }, [playing])

  const motionFor = MOTIONS[index % MOTIONS.length]

  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={`${index}-${photos[index]}`}
          src={photos[index]}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover"
          initial={reduce || !playing ? { opacity: 0 } : { opacity: 0, ...motionFor.from }}
          animate={reduce || !playing ? { opacity: 1 } : { opacity: 1, ...motionFor.to }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.7 },
            default: { duration: PHOTO_SECONDS + 0.7, ease: 'linear' },
          }}
        />
      </AnimatePresence>
    </div>
  )
}
