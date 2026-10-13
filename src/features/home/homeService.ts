/** The top of the customer home page: hero dishes + shop stories (GET /home/spotlight). */
import { apiClient } from '@/services/apiClient'

export interface SpotlightDish {
  id: string
  name: string
  imageUrl: string | null
  price: number
  strikePrice: number | null
  /** "30% off", "Today's special", "Bestseller", … */
  label: string | null
}

export interface HeroDish extends SpotlightDish {
  business: {
    slug: string
    name: string
    logoUrl: string | null
    distanceMeters: number | null
    isFollowed: boolean
  }
}

export type StoryKind = 'deal' | 'spin' | 'special' | 'combo'

export interface ShopStory {
  slug: string
  name: string
  logoUrl: string | null
  coverUrl: string | null
  isFollowed: boolean
  distanceMeters: number | null
  /** Something new today (deal / spin / special / new combo). */
  hasNews: boolean
  kind: StoryKind | null
  headline: string | null
  items: SpotlightDish[]
}

export interface HomeSpotlight {
  hero: HeroDish[]
  stories: ShopStory[]
}

export const homeService = {
  spotlight: (params: { lat?: number; lng?: number }): Promise<HomeSpotlight> =>
    apiClient.get<HomeSpotlight>('home/spotlight', { query: { lat: params.lat, lng: params.lng } }),
}
