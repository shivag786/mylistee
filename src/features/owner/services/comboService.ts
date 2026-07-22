/**
 * Combo builder API (Phase 7.3). Multipart FormData for the optional custom
 * image; updates use POST + `_method=PUT`. Items are sent as nested fields
 * (`items[0][product_id]`) which Laravel parses into an array.
 */
import { apiClient } from '@/services/apiClient'
import type { Combo, ComboFormValues } from '../comboTypes'

function toFormData(values: Partial<ComboFormValues>): FormData {
  const form = new FormData()
  const { image, items, ...fields } = values

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0')
    } else {
      form.append(key, String(value))
    }
  }

  items?.forEach((item, i) => {
    form.append(`items[${i}][product_id]`, item.product_id)
    form.append(`items[${i}][quantity]`, String(item.quantity))
  })

  if (image) form.append('image', image)
  return form
}

export const comboService = {
  list: (): Promise<Combo[]> => apiClient.get<Combo[]>('business/combos'),

  create: (values: ComboFormValues): Promise<Combo> =>
    apiClient.post<Combo>('business/combos', toFormData(values)),

  update: (id: string, values: Partial<ComboFormValues>): Promise<Combo> => {
    const form = toFormData(values)
    form.append('_method', 'PUT')
    return apiClient.post<Combo>(`business/combos/${id}`, form)
  },

  remove: (id: string): Promise<void> =>
    apiClient.delete(`business/combos/${id}`).then(() => undefined),
}
