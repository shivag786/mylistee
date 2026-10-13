import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Images, Play } from 'lucide-react'
import { FeedShopTags } from '@/features/businesses/components/FeedShopTags'
import { PhotoReel } from './PhotoReel'
import { playExclusive, prefersSavingData, releaseVideo } from './reelMedia'
import type { ShopReel } from './reelService'

/**
 * A 9:16 reel in the home row. Plays muted while it's mostly on screen — one
 * video at a time across the page — and shows only its poster on Data Saver.
 */
export function ReelCard({ reel, onOpen }: { reel: ShopReel; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const saveData = prefersSavingData()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= 0.7), {
      threshold: [0, 0.7, 1],
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || saveData) return
    if (visible) playExclusive(video)
    else releaseVideo(video)
  }, [visible, saveData])

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.96 }}
      className="relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-secondary text-left text-white shadow-floating focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Play reel from ${reel.business?.name ?? 'shop'}${reel.caption ? `: ${reel.caption}` : ''}`}
    >
      {reel.type === 'video' && reel.videoUrl && !saveData ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 size-full object-cover"
        />
      ) : reel.type === 'photos' && reel.photoUrls.length > 0 ? (
        <PhotoReel photos={reel.photoUrls} playing={visible && !saveData} className="absolute inset-0" />
      ) : (
        reel.posterUrl && <img src={reel.posterUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/80" />

      <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/35 backdrop-blur" aria-hidden>
        {reel.type === 'photos' ? <Images className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
      </span>

      <span className="absolute inset-x-0 bottom-0 space-y-1 p-2.5">
        {reel.caption && <span className="line-clamp-2 block text-small font-semibold leading-snug">{reel.caption}</span>}
        {reel.business && (
          <span className="flex items-center gap-1.5">
            {reel.business.logoUrl && (
              <img src={reel.business.logoUrl} alt="" className="size-5 shrink-0 rounded-full bg-white object-cover" />
            )}
            <span className="truncate text-small font-medium text-white/90">{reel.business.name}</span>
          </span>
        )}
        {reel.business && (
          <span className="block [&_*]:!text-white/80">
            <FeedShopTags isFollowed={reel.business.isFollowed} distanceMeters={reel.business.distanceMeters} />
          </span>
        )}
      </span>
    </motion.button>
  )
}
