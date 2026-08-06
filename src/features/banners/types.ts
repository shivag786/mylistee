export type BannerPlacement = 'home_top' | 'home_after_combos'

/** Public banner shown in a homepage carousel. */
export interface Banner {
  id: string
  title: string
  imageUrl: string | null
  linkUrl: string | null
  placement: string
}

/** Live banners grouped by placement slot. */
export type BannerFeed = Record<BannerPlacement, Banner[]>
