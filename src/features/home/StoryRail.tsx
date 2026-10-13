import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ShopStory } from './homeService'
import { StoryViewer } from './StoryViewer'

const SEEN_KEY = 'listee:storiesSeen'

/** A story counts as seen per headline, so a new offer lights the ring again. */
const storyId = (s: ShopStory) => `${s.slug}|${s.headline ?? ''}`

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function writeSeen(seen: Set<string>): void {
  try {
    // Keep the list short; old headlines no longer matter.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)))
  } catch {
    // Storage blocked — rings just stay lit.
  }
}

/**
 * Shop circles under the hero: shops the viewer follows, and shops with
 * something new today. A spinning colour ring marks news not yet seen; tapping
 * opens the full-screen story.
 */
export function StoryRail({ stories }: { stories: ShopStory[] }) {
  const reduce = useReducedMotion()
  const [seen, setSeen] = useState(readSeen)
  const [openAt, setOpenAt] = useState<number | null>(null)

  function markSeen(story: ShopStory) {
    if (!story.hasNews) return
    setSeen((prev) => {
      if (prev.has(storyId(story))) return prev
      const next = new Set(prev).add(storyId(story))
      writeSeen(next)
      return next
    })
  }

  if (stories.length === 0) return null

  return (
    <section aria-label="Shop stories">
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story, i) => {
          const fresh = story.hasNews && !seen.has(storyId(story))
          return (
            <motion.button
              key={story.slug}
              type="button"
              onClick={() => setOpenAt(i)}
              initial={reduce ? false : { opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: Math.min(i, 8) * 0.05 }}
              whileTap={{ scale: 0.92 }}
              className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1"
              aria-label={`${story.name}${story.headline ? `: ${story.headline}` : ''}`}
            >
              <span className="relative grid size-[4.25rem] place-items-center">
                {/* Ring: spinning brand colours when there's unseen news, grey otherwise. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-0 rounded-full',
                    fresh
                      ? 'bg-[conic-gradient(var(--primary),var(--gold),var(--primary))] motion-safe:animate-[spin_4s_linear_infinite]'
                      : 'bg-border',
                  )}
                />
                <span className="relative grid size-[3.85rem] place-items-center overflow-hidden rounded-full bg-surface ring-2 ring-surface">
                  {story.logoUrl ? (
                    <img src={story.logoUrl} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="text-body-lg font-black text-primary">{story.name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                {story.isFollowed && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background" aria-hidden>
                    <Heart className="size-2.5 fill-current" />
                  </span>
                )}
              </span>
              <span className={cn('line-clamp-1 w-full text-center text-small', fresh ? 'font-semibold text-foreground' : 'text-text-secondary')}>
                {story.name}
              </span>
            </motion.button>
          )
        })}
      </div>

      <StoryViewer stories={stories} openAt={openAt} onClose={() => setOpenAt(null)} onView={markSeen} />
    </section>
  )
}
