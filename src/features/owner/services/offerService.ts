/**
 * Offer management API (document/phase/11 §Offer Endpoints). Create/update send
 * multipart FormData for the optional image; updates use POST + `_method=PUT`.
 */
import { apiClient } from '@/services/apiClient'
import type { Offer, OfferFormValues, OfferStatus } from '../types'

function toFormData(values: Partial<OfferFormValues>): FormData {
  const form = new FormData()
  const { image, ...fields } = values
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value))
  }
  if (image) form.append('image', image)
  return form
}

export const offerService = {
  async list(): Promise<Offer[]> {
    return apiClient.get<Offer[]>('business/offers')
  },

  async create(values: OfferFormValues): Promise<Offer> {
    return apiClient.post<Offer>('business/offers', toFormData(values))
  },

  async update(id: string, values: Partial<OfferFormValues>): Promise<Offer> {
    const form = toFormData(values)
    form.append('_method', 'PUT')
    return apiClient.post<Offer>(`business/offers/${id}`, form)
  },

  async setStatus(id: string, status: Extract<OfferStatus, 'active' | 'archived'>): Promise<Offer> {
    return apiClient.patch<Offer>(`business/offers/${id}/status`, { status })
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`business/offers/${id}`)
  },
}
