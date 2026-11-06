/**
 * Admin: personal links across shops — which shops have theirs switched on.
 * The link is free and never expires, so there is nothing to give or sell.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'

export interface AdminPersonalLinkRow {
  id: string
  name: string
  slug: string
  ownerName: string | null
  phone: string | null
  email: string | null
  enabled: boolean
}

export type PersonalLinkStatusFilter = '' | 'on' | 'off'

export interface PersonalLinkFilters {
  page: number
  search?: string
  status?: PersonalLinkStatusFilter
}

export const adminPersonalLinkService = {
  list: (f: PersonalLinkFilters) => {
    const q = new URLSearchParams({ page: String(f.page) })
    if (f.search) q.set('search', f.search)
    if (f.status) q.set('status', f.status)
    return apiClient.getPage<AdminPersonalLinkRow>(`admin/personal-links?${q.toString()}`)
  },
}

export const useAdminPersonalLinks = (f: PersonalLinkFilters) =>
  useQuery({ queryKey: ['admin', 'personal-links', f], queryFn: () => adminPersonalLinkService.list(f), placeholderData: keepPreviousData })
