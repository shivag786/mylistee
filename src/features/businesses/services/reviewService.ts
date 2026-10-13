/** Business reviews (document/phase/11 §Review Endpoints). */
import { apiClient } from '@/services/apiClient'

export interface ReviewItemRating {
  type: 'product' | 'combo'
  name: string
  rating: number
}

export interface Review {
  id: string
  /** Null when a review-link reviewer skipped the overall star. */
  rating: number | null
  comment: string | null
  reply: string | null
  customerName: string | null
  /** Left by a signed-in customer after a fulfilled order (not via the review link). */
  isVerified: boolean
  isMine: boolean
  items: ReviewItemRating[]
  createdAt: string | null
}

export const reviewService = {
  async list(slug: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`businesses/${slug}/reviews`)
  },
  /** Reviews are verified purchases — submitted against a fulfilled order. */
  async submit(orderId: string, rating: number, comment?: string): Promise<Review> {
    return apiClient.post<Review>('reviews', { orderId, rating, comment })
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`reviews/${id}`)
  },
}
