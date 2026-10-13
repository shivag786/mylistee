/** The owner's customer book — the shop's own customers, kept by mobile number. */
import { apiClient } from '@/services/apiClient'
import type { Paginated } from '@/types/api'

export interface ShopCustomer {
  id: string
  /** 10 digits, no country code. */
  phone: string
  name: string | null
  email: string | null
  city: string | null
  /** 'manual' = added by the owner, 'review' = came in through the review link. */
  source: 'manual' | 'review'
  reviewsCount: number
  createdAt: string | null
}

export interface ShopCustomerInput {
  phone: string
  name?: string
  email?: string
  city?: string
}

export const customerService = {
  list: (params: { search?: string; page?: number }): Promise<Paginated<ShopCustomer>> =>
    apiClient.getPage<ShopCustomer>('business/customers', {
      query: { search: params.search || undefined, page: params.page ?? 1 },
    }),
  create: (input: ShopCustomerInput): Promise<ShopCustomer> =>
    apiClient.post<ShopCustomer>('business/customers', input),
  update: (id: string, input: ShopCustomerInput): Promise<ShopCustomer> =>
    apiClient.put<ShopCustomer>(`business/customers/${id}`, input),
  remove: (id: string): Promise<void> => apiClient.delete(`business/customers/${id}`).then(() => undefined),
}
