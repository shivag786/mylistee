/**
 * TanStack Query hooks for the Super Admin panel (Milestone 14). Server state
 * lives here; mutations invalidate the affected lists so the UI stays in sync.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { adminService } from '../services/adminService'
import type {
  BusinessUpdateInput,
  CategoryInput,
  ImportApplyInput,
  ListFilters,
  PlatformSettings,
} from '../types'

export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  fraud: ['admin', 'fraud'] as const,
  businesses: (f: ListFilters) => ['admin', 'businesses', f] as const,
  customers: (f: ListFilters) => ['admin', 'customers', f] as const,
  offers: (f: ListFilters) => ['admin', 'offers', f] as const,
  reviews: (f: ListFilters) => ['admin', 'reviews', f] as const,
  plans: ['admin', 'plans'] as const,
  featureFlags: ['admin', 'feature-flags'] as const,
  settings: ['admin', 'settings'] as const,
  cms: ['admin', 'cms'] as const,
  auditLogs: (f: ListFilters) => ['admin', 'audit-logs', f] as const,
  categories: ['admin', 'categories'] as const,
  categoryRequests: (status?: string) => ['admin', 'category-requests', status ?? 'all'] as const,
}

function invalidate(qc: ReturnType<typeof useQueryClient>, key: string) {
  void qc.invalidateQueries({ queryKey: ['admin', key] })
  void qc.invalidateQueries({ queryKey: adminKeys.dashboard })
}

export const useAdminDashboard = () =>
  useQuery({ queryKey: adminKeys.dashboard, queryFn: () => adminService.dashboard() })

export const useAdminFraud = () =>
  useQuery({ queryKey: adminKeys.fraud, queryFn: () => adminService.fraud() })

// ---- Businesses ----
export const useAdminBusinesses = (filters: ListFilters) =>
  useQuery({
    queryKey: adminKeys.businesses(filters),
    queryFn: () => adminService.businesses(filters),
    placeholderData: keepPreviousData,
  })

export function useBusinessActions() {
  const qc = useQueryClient()
  const done = () => invalidate(qc, 'businesses')
  return {
    setStatus: useMutation({ mutationFn: (v: { id: string; status: string }) => adminService.setBusinessStatus(v.id, v.status), onSuccess: done }),
    verify: useMutation({ mutationFn: (id: string) => adminService.verifyBusiness(id), onSuccess: done }),
    feature: useMutation({ mutationFn: (id: string) => adminService.featureBusiness(id), onSuccess: done }),
    update: useMutation({
      mutationFn: (v: { id: string; input: BusinessUpdateInput }) => adminService.updateBusiness(v.id, v.input),
      onSuccess: done,
    }),
    uploadImage: useMutation({
      mutationFn: (v: { id: string; type: 'logo' | 'cover'; image: File }) =>
        adminService.uploadBusinessImage(v.id, v.type, v.image),
      onSuccess: done,
    }),
  }
}

// ---- Business Import Engine (SPEC-011) ----
export const useImportPreview = () =>
  useMutation({ mutationFn: (url: string) => adminService.importPreview(url) })

export function useImportApply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ImportApplyInput) => adminService.importApply(input),
    onSuccess: () => {
      invalidate(qc, 'businesses')
      void qc.invalidateQueries({ queryKey: ['admin', 'import-logs'] })
    },
  })
}

export const useImportLogs = (filters: ListFilters) =>
  useQuery({
    queryKey: ['admin', 'import-logs', filters] as const,
    queryFn: () => adminService.importLogs(filters),
    placeholderData: keepPreviousData,
  })

// ---- Customers ----
export const useAdminCustomers = (filters: ListFilters) =>
  useQuery({
    queryKey: adminKeys.customers(filters),
    queryFn: () => adminService.customers(filters),
    placeholderData: keepPreviousData,
  })

export function useSetCustomerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; status: string }) => adminService.setCustomerStatus(v.id, v.status),
    onSuccess: () => invalidate(qc, 'customers'),
  })
}

// ---- Offers ----
export const useAdminOffers = (filters: ListFilters) =>
  useQuery({
    queryKey: adminKeys.offers(filters),
    queryFn: () => adminService.offers(filters),
    placeholderData: keepPreviousData,
  })

export function useSetOfferStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; status: string }) => adminService.setOfferStatus(v.id, v.status),
    onSuccess: () => invalidate(qc, 'offers'),
  })
}

// ---- Reviews ----
export const useAdminReviews = (filters: ListFilters) =>
  useQuery({
    queryKey: adminKeys.reviews(filters),
    queryFn: () => adminService.reviews(filters),
    placeholderData: keepPreviousData,
  })

export function useSetReviewStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; status: string }) => adminService.setReviewStatus(v.id, v.status),
    onSuccess: () => invalidate(qc, 'reviews'),
  })
}

// ---- Plans ----
export const useAdminPlans = () =>
  useQuery({ queryKey: adminKeys.plans, queryFn: () => adminService.plans() })

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { key: string; payload: Record<string, unknown> }) => adminService.updatePlan(v.key, v.payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.plans }),
  })
}

// ---- Broadcast ----
export const useBroadcast = () =>
  useMutation({ mutationFn: adminService.broadcast })

// ---- Feature flags ----
export const useFeatureFlags = () =>
  useQuery({ queryKey: adminKeys.featureFlags, queryFn: () => adminService.featureFlags() })

export function useSetFeatureFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { key: string; enabled: boolean }) => adminService.setFeatureFlag(v.key, v.enabled),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.featureFlags }),
  })
}

// ---- Settings ----
export const useAdminSettings = () =>
  useQuery({ queryKey: adminKeys.settings, queryFn: () => adminService.settings() })

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<PlatformSettings>) => adminService.updateSettings(payload),
    onSuccess: (data) => qc.setQueryData(adminKeys.settings, data),
  })
}

// ---- CMS ----
export const useCmsPages = () =>
  useQuery({ queryKey: adminKeys.cms, queryFn: () => adminService.cmsPages() })

export function useUpdateCms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { slug: string; payload: { title: string; body?: string; status?: string } }) =>
      adminService.updateCms(v.slug, v.payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.cms }),
  })
}

// ---- Audit logs ----
export const useAuditLogs = (filters: ListFilters) =>
  useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: () => adminService.auditLogs(filters),
    placeholderData: keepPreviousData,
  })

// ---- Master categories (Phase 7.1) ----
export const useAdminCategories = () =>
  useQuery({ queryKey: adminKeys.categories, queryFn: () => adminService.categories() })

export function useCategoryActions() {
  const qc = useQueryClient()
  const done = () => invalidate(qc, 'categories')
  return {
    create: useMutation({
      mutationFn: (input: CategoryInput) => adminService.createCategory(input),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; input: CategoryInput }) => adminService.updateCategory(v.id, v.input),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => adminService.deleteCategory(id),
      onSuccess: done,
    }),
    reorder: useMutation({
      mutationFn: (order: string[]) => adminService.reorderCategories(order),
      onSuccess: done,
    }),
    setVisibility: useMutation({
      mutationFn: (v: { id: string; payload: { showOnHomepage?: boolean; showInSearch?: boolean } }) =>
        adminService.setCategoryVisibility(v.id, v.payload),
      onSuccess: done,
    }),
  }
}

export const useCategoryRequests = (status?: string) =>
  useQuery({
    queryKey: adminKeys.categoryRequests(status),
    queryFn: () => adminService.categoryRequests(status),
    placeholderData: keepPreviousData,
  })

export function useCategoryRequestActions() {
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'category-requests'] })
    void qc.invalidateQueries({ queryKey: adminKeys.categories })
    void qc.invalidateQueries({ queryKey: adminKeys.dashboard })
  }
  return {
    approve: useMutation({ mutationFn: (id: string) => adminService.approveCategoryRequest(id), onSuccess: done }),
    reject: useMutation({
      mutationFn: (v: { id: string; note?: string }) => adminService.rejectCategoryRequest(v.id, v.note),
      onSuccess: done,
    }),
  }
}
