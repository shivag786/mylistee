import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Clapperboard } from 'lucide-react'
import { HorizontalScroller } from '@/components/navigation/HorizontalScroller'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useReelFeed } from './useReels'
import { ReelCard } from './ReelCard'
import { ReelViewer } from './ReelViewer'

/** Home "Reels near you": 9:16 cards that play in place, full screen on tap. Hides when empty. */
export function ReelsRow({ title = 'Reels near you' }: { title?: string }) {
  const reduce = useReducedMotion()
  const { data, isLoading } = useReelFeed()
  const [openAt, setOpenAt] = useState<number | null>(null)

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <h2 className="mb-3 inline-flex items-center gap-1.5 text-subtitle font-semibold text-foreground">
        <span className="grid size-7 place-items-center rounded-full bg-primary-soft">
          <Clapperboard className="size-4 text-primary" aria-hidden />
        </span>
        {title}
      </h2>
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[9/16] w-36 shrink-0 rounded-2xl" />
            ))
          : data!.map((reel, i) => (
              <motion.div
                key={reel.id}
                className="w-36 shrink-0 snap-start"
                initial={reduce ? false : { opacity: 0, y: 24, rotate: i % 2 ? 2 : -2 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 20,
                  delay: Math.min(i, 5) * 0.06,
                }}
              >
                <ReelCard reel={reel} onOpen={() => setOpenAt(i)} />
              </motion.div>
            ))}
      </HorizontalScroller>
      <ReelViewer reels={data ?? []} openAt={openAt} onClose={() => setOpenAt(null)} />
    </section>
  )
}
