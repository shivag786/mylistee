/**
 * Customer home page sections — the registry the admin's "Home layout" page
 * arranges, and the default order. Ids mirror SettingService::HOME_SECTIONS.
 */

export type HomeSectionId =
  | 'hero'
  | 'stories'
  | 'banners_top'
  | 'search'
  | 'rewards'
  | 'categories'
  | 'deals'
  | 'reels'
  | 'combos'
  | 'banners_after_combos'
  | 'festival'
  | 'recommended'
  | 'new'
  | 'nearby'

export type HomeSlot = 'all' | 'morning' | 'afternoon' | 'evening' | 'night'

export interface HomeSectionSetting {
  id: HomeSectionId
  enabled: boolean
  /** Replaces the section's heading; null keeps the default. */
  title?: string | null
  /** Only show in this part of the day ('all' / null = always). */
  slot?: HomeSlot | null
}

export interface HomeSectionMeta {
  id: HomeSectionId
  label: string
  description: string
  /** Default heading, when the section has one the admin can rename. */
  defaultTitle?: string
}

/** In the built-in order. */
export const HOME_SECTIONS: HomeSectionMeta[] = [
  { id: 'hero', label: '3D dish hero', description: 'Greeting and a 3D ring of dishes from followed and nearby shops' },
  { id: 'stories', label: 'Shop stories', description: 'Circles for followed shops and shops with news today' },
  { id: 'banners_top', label: 'Top banners', description: 'Banners in the "Home — top" slot' },
  { id: 'search', label: 'Search bar', description: 'Animated search' },
  { id: 'rewards', label: 'Rewards', description: 'Coins progress and the spin prompt' },
  { id: 'categories', label: 'Category chips', description: 'Quick category filters (also needs the feature flag)' },
  { id: 'deals', label: "Today's deals", description: 'Product offers, followed and nearby first', defaultTitle: "Today's Deals" },
  { id: 'reels', label: 'Reels', description: 'Short videos and photo reels from shops', defaultTitle: 'Reels near you' },
  { id: 'combos', label: 'Combos', description: 'Combo deals, max two per shop', defaultTitle: 'Combos near you' },
  { id: 'banners_after_combos', label: 'Middle banners', description: 'Banners in the "Home — after combos" slot' },
  { id: 'festival', label: 'Festival specials', description: 'Festival-type promotions', defaultTitle: 'Festival specials' },
  { id: 'recommended', label: 'Recommended shops', description: 'Verified, well-rated shops', defaultTitle: 'Recommended' },
  { id: 'new', label: 'New shops', description: 'Recently joined shops', defaultTitle: 'New on Listee' },
  { id: 'nearby', label: 'Nearby shops', description: 'Grid of shops by distance', defaultTitle: 'Nearby you' },
]

export const HOME_SLOTS: { value: HomeSlot; label: string; hours: string }[] = [
  { value: 'all', label: 'All day', hours: '' },
  { value: 'morning', label: 'Morning', hours: '5 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', hours: '12 – 5 PM' },
  { value: 'evening', label: 'Evening', hours: '5 – 9 PM' },
  { value: 'night', label: 'Night', hours: '9 PM – 5 AM' },
]

export const DEFAULT_LAYOUT: HomeSectionSetting[] = HOME_SECTIONS.map((s) => ({ id: s.id, enabled: true, title: null, slot: 'all' }))

/**
 * The saved layout made complete: unknown ids dropped, and any section the
 * saved list doesn't mention (e.g. one added after it was saved) placed at its
 * default position, switched on.
 */
export function resolveLayout(saved: HomeSectionSetting[] | null | undefined): HomeSectionSetting[] {
  if (!saved || saved.length === 0) return DEFAULT_LAYOUT
  const known = new Set(HOME_SECTIONS.map((s) => s.id))
  const result = saved.filter((s) => known.has(s.id))
  const present = new Set(result.map((s) => s.id))

  HOME_SECTIONS.forEach((meta, defaultIndex) => {
    if (present.has(meta.id)) return
    // Insert after the nearest earlier default neighbour that is in the list.
    const before = HOME_SECTIONS.slice(0, defaultIndex).reverse().find((m) => present.has(m.id))
    const at = before ? result.findIndex((s) => s.id === before.id) + 1 : 0
    result.splice(at, 0, { id: meta.id, enabled: true, title: null, slot: 'all' })
    present.add(meta.id)
  })

  return result
}

/** The part of the day right now, in the viewer's own time. */
export function currentSlot(date = new Date()): Exclude<HomeSlot, 'all'> {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

/** Sections to render now, in order. */
export function visibleSections(saved: HomeSectionSetting[] | null | undefined, now = new Date()): HomeSectionSetting[] {
  const slot = currentSlot(now)
  return resolveLayout(saved).filter((s) => s.enabled && (!s.slot || s.slot === 'all' || s.slot === slot))
}
