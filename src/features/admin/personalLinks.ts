/**
 * Admin: personal links across shops — status list, and giving a package
 * free (or recorded as paid offline) or through a Razorpay payment link.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import type { PersonalLinkGrant, PersonalLinkPackKey, PersonalLinkState } from '@/features/owner/personalLink'

export interface AdminPersonalLinkRow {
  id: string
  name: string
  ownerName: string | null
  phone: string | null
  email: string | null
  enabled: boolean
  active: boolean
  expiresAt: string | null
  daysLeft: number
  trialUsed: boolean
  pendingLinks: number
}

export type PersonalLinkStatusFilter = '' | 'active' | 'expiring' | 'expired' | 'never'

export interface PersonalLinkFilters {
  page: number
  search?: string
  status?: PersonalLinkStatusFilter
}

export interface AdminPersonalLinkDetail {
  business: { id: string; name: string; phone: string | null; email: string | null }
  state: PersonalLinkState
}

export interface GrantPayload {
  pack: PersonalLinkPackKey | 'custom'
  days?: number
  mode: 'free' | 'link'
  amount?: number
  note?: string
  notify?: boolean
}

const keys = {
  list: (f: PersonalLinkFilters) => ['admin', 'personal-links', f] as const,
  detail: (id: string) => ['admin', 'personal-links', 'detail', id] as const,
}

export const adminPersonalLinkService = {
  list: (f: PersonalLinkFilters) => {
    const q = new URLSearchParams({ page: String(f.page) })
    if (f.search) q.set('search', f.search)
    if (f.status) q.set('status', f.status)
    return apiClient.getPage<AdminPersonalLinkRow>(`admin/personal-links?${q.toString()}`)
  },
  detail: (id: string) => apiClient.get<AdminPersonalLinkDetail>(`admin/personal-links/${id}`),
  grant: (id: string, payload: GrantPayload) =>
    apiClient.post<AdminPersonalLinkDetail & { grant: PersonalLinkGrant }>(`admin/personal-links/${id}/grant`, payload),
  sync: (grantId: string) => apiClient.post<AdminPersonalLinkDetail>(`admin/personal-links/grants/${grantId}/sync`),
  cancel: (grantId: string) => apiClient.post<AdminPersonalLinkDetail>(`admin/personal-links/grants/${grantId}/cancel`),
}

export const useAdminPersonalLinks = (f: PersonalLinkFilters) =>
  useQuery({ queryKey: keys.list(f), queryFn: () => adminPersonalLinkService.list(f), placeholderData: keepPreviousData })

export const useAdminPersonalLink = (id: string | null) =>
  useQuery({ queryKey: keys.detail(id ?? ''), queryFn: () => adminPersonalLinkService.detail(id!), enabled: Boolean(id) })

/** Every action returns the fresh detail; drop it in and refresh the list. */
export function usePersonalLinkAction<A, R extends AdminPersonalLinkDetail = AdminPersonalLinkDetail>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (detail) => {
      qc.setQueryData(keys.detail(detail.business.id), detail)
      void qc.invalidateQueries({ queryKey: ['admin', 'personal-links'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
    },
  })
}
