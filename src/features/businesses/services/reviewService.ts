/** Business reviews (document/phase/11 §Review Endpoints). */
import { apiClient } from '@/services/apiClient'

export interface Review {
  id: string
  rating: number
  comment: string | null
  reply: string | null
  customerName: string | null
  isMine: boolean
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
