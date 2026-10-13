/** Shop Reels — public feed + the owner's own reels. */
import { apiClient } from '@/services/apiClient'

export interface ReelDish {
  id: string
  name: string
  price: number
  strikePrice: number | null
  imageUrl: string | null
}

export interface ShopReel {
  id: string
  type: 'video' | 'photos'
  videoUrl: string | null
  /** Poster frame for a video, or the first photo. */
  posterUrl: string | null
  photoUrls: string[]
  caption: string | null
  durationSeconds: number | null
  isVisible: boolean
  views: number
  dish: ReelDish | null
  business?: {
    slug: string
    name: string
    logoUrl: string | null
    distanceMeters: number | null
    isFollowed: boolean
  }
  createdAt: string | null
}

export interface NewReel {
  type: 'video' | 'photos'
  video?: File
  poster?: Blob | null
  photos?: File[]
  caption?: string
  productId?: string
  durationSeconds?: number
}

export const reelService = {
  /** Ranked for the viewer: followed shops, then nearby, fresh first — two per shop. */
  feed: (params: { lat?: number; lng?: number; limit?: number }) =>
    apiClient.get<ShopReel[]>('reels', { query: { limit: params.limit ?? 12, lat: params.lat, lng: params.lng } }),
  forShop: (slug: string) => apiClient.get<ShopReel[]>(`businesses/${slug}/reels`),
  /** Fire-and-forget; the server counts one view per address per hour. */
  view: (id: string) => apiClient.post(`reels/${id}/view`).catch(() => undefined),

  mine: () => apiClient.get<ShopReel[]>('business/reels'),
  create: (input: NewReel): Promise<ShopReel> => {
    const form = new FormData()
    form.append('type', input.type)
    if (input.video) form.append('video', input.video)
    if (input.poster) form.append('poster', input.poster, 'poster.jpg')
    input.photos?.forEach((photo) => form.append('photos[]', photo))
    if (input.caption) form.append('caption', input.caption)
    if (input.productId) form.append('productId', input.productId)
    if (input.durationSeconds) form.append('durationSeconds', String(input.durationSeconds))
    return apiClient.post<ShopReel>('business/reels', form)
  },
  setVisible: (id: string, visible: boolean) => apiClient.patch<ShopReel>(`business/reels/${id}/visibility`, { visible }),
  remove: (id: string) => apiClient.delete(`business/reels/${id}`).then(() => undefined),
}
