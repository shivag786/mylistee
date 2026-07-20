/**
 * Business owner API — all calls go through the shared apiClient (service-layer
 * rule, document/phase/04). Profile create/update send multipart FormData so
 * logo/cover uploads work; updates use POST + `_method=PUT` spoofing because
 * PHP does not parse multipart bodies on native PUT.
 */
import { apiClient } from '@/services/apiClient'
import type { BusinessFormValues, BusinessQr, DashboardData, GalleryImage, OwnerBusiness } from '../types'

/** Append only defined, non-empty form fields to a FormData payload. */
function appendField(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return
  if (value instanceof File) {
    form.append(key, value)
  } else {
    form.append(key, String(value))
  }
}

function toFormData(values: Partial<BusinessFormValues>): FormData {
  const form = new FormData()
  const { logo, cover, ...fields } = values
  for (const [key, value] of Object.entries(fields)) appendField(form, key, value)
  if (logo) form.append('logo', logo)
  if (cover) form.append('cover', cover)
  return form
}

export const ownerService = {
  async getProfile(): Promise<OwnerBusiness> {
    return apiClient.get<OwnerBusiness>('business/profile')
  },

  async register(values: BusinessFormValues): Promise<OwnerBusiness> {
    return apiClient.post<OwnerBusiness>('business', toFormData(values))
  },

  async updateProfile(values: Partial<BusinessFormValues>): Promise<OwnerBusiness> {
    const form = toFormData(values)
    form.append('_method', 'PUT') // method spoofing for multipart
    return apiClient.post<OwnerBusiness>('business/profile', form)
  },

  async getDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('business/dashboard')
  },

  async getQr(): Promise<BusinessQr> {
    return apiClient.get<BusinessQr>('business/qr')
  },

  async recordQrDownload(): Promise<BusinessQr> {
    return apiClient.post<BusinessQr>('business/qr/download')
  },

  async addGalleryImage(image: File): Promise<GalleryImage> {
    const form = new FormData()
    form.append('image', image)
    return apiClient.post<GalleryImage>('business/gallery', form)
  },

  async removeGalleryImage(id: string): Promise<void> {
    await apiClient.delete(`business/gallery/${id}`)
  },
}
