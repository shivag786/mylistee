/**
 * Super Admin API (Milestone 14). Service-layer rule: UI never calls the API
 * directly (document/phase/04). Every list is server-paginated via
 * `apiClient.getPage`; every mutation returns the updated record.
 */
import { apiClient, getAuthToken } from '@/services/apiClient'
import { apiConfig } from '@/config/api.config'
import type { Paginated } from '@/types/api'
import type {
  AdminBusiness,
  BusinessUpdateInput,
  AdminCategory,
  AdminCustomer,
  AdminDashboard,
  AdminOffer,
  AdminReview,
  AuditLog,
  CategoryInput,
  CategoryRequestItem,
  CmsPage,
  FeatureFlag,
  FraudSignals,
  ImportApplyInput,
  ImportApplyResult,
  ImportLog,
  ImportPreviewResult,
  ListFilters,
  Plan,
  PlatformSettings,
} from '../types'

type Query = Record<string, string | number | undefined>

function toQuery(f: ListFilters = {}): Query {
  return {
    search: f.search || undefined,
    status: f.status || undefined,
    page: f.page,
    perPage: f.perPage,
  }
}

/** Build multipart FormData for a category (image upload). */
function categoryFormData(input: CategoryInput): FormData {
  const form = new FormData()
  form.append('name', input.name)
  if (input.description !== undefined) form.append('description', input.description)
  if (input.altText !== undefined) form.append('alt_text', input.altText)
  if (input.icon !== undefined) form.append('icon', input.icon)
  if (input.status !== undefined) form.append('status', input.status)
  if (input.showOnHomepage !== undefined)
    form.append('show_on_homepage', input.showOnHomepage ? '1' : '0')
  if (input.showInSearch !== undefined)
    form.append('show_in_search', input.showInSearch ? '1' : '0')
  if (input.image) form.append('image', input.image)
  return form
}

export const adminService = {
  dashboard: () => apiClient.get<AdminDashboard>('admin/dashboard'),
  fraud: () => apiClient.get<FraudSignals>('admin/fraud'),

  businesses: (f?: ListFilters): Promise<Paginated<AdminBusiness>> =>
    apiClient.getPage<AdminBusiness>('admin/businesses', { query: toQuery(f) }),
  setBusinessStatus: (id: string, status: string) =>
    apiClient.patch<AdminBusiness>(`admin/businesses/${id}/status`, { status }),
  updateBusiness: (id: string, input: BusinessUpdateInput) =>
    apiClient.put<AdminBusiness>(`admin/businesses/${id}`, {
      name: input.name,
      category_id: input.categoryId ?? null,
      description: input.description ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      facebook: input.facebook ?? null,
      instagram: input.instagram ?? null,
      whatsapp: input.whatsapp ?? null,
      gst: input.gst ?? null,
      opening_time: input.openingTime || null,
      closing_time: input.closingTime || null,
      status: input.status,
    }),
  uploadBusinessImage: (id: string, type: 'logo' | 'cover', image: File) => {
    const form = new FormData()
    form.append('type', type)
    form.append('image', image)
    return apiClient.post<AdminBusiness>(`admin/businesses/${id}/image`, form)
  },
  verifyBusiness: (id: string) => apiClient.patch<AdminBusiness>(`admin/businesses/${id}/verify`),
  featureBusiness: (id: string) => apiClient.patch<AdminBusiness>(`admin/businesses/${id}/feature`),

  // ---- Business Import Engine (SPEC-011) ----
  importPreview: (url: string, source = 'google') =>
    apiClient.post<ImportPreviewResult>('admin/businesses/import/preview', { url, source }),
  importApply: (input: ImportApplyInput) =>
    apiClient.post<ImportApplyResult>('admin/businesses/import', {
      source: input.source ?? 'google',
      url: input.url,
      placeId: input.placeId ?? null,
      mode: input.mode,
      businessId: input.businessId ?? null,
      fields: input.fields ?? {},
    }),
  importLogs: (f?: ListFilters): Promise<Paginated<ImportLog>> =>
    apiClient.getPage<ImportLog>('admin/businesses/import/logs', {
      query: { status: f?.status || undefined, page: f?.page, perPage: f?.perPage },
    }),

  // ---- Master categories (Phase 7.1) ----
  categories: () => apiClient.get<AdminCategory[]>('admin/categories'),
  createCategory: (input: CategoryInput) =>
    apiClient.post<AdminCategory>('admin/categories', categoryFormData(input)),
  updateCategory: (id: string, input: CategoryInput) => {
    const form = categoryFormData(input)
    form.append('_method', 'PUT') // method spoofing for multipart
    return apiClient.post<AdminCategory>(`admin/categories/${id}`, form)
  },
  deleteCategory: (id: string) => apiClient.delete<null>(`admin/categories/${id}`),
  reorderCategories: (order: string[]) =>
    apiClient.patch<AdminCategory[]>('admin/categories/reorder', { order }),
  setCategoryVisibility: (
    id: string,
    payload: { showOnHomepage?: boolean; showInSearch?: boolean },
  ) => {
    const body: Record<string, boolean> = {}
    if (payload.showOnHomepage !== undefined) body.show_on_homepage = payload.showOnHomepage
    if (payload.showInSearch !== undefined) body.show_in_search = payload.showInSearch
    return apiClient.patch<AdminCategory>(`admin/categories/${id}/visibility`, body)
  },

  categoryRequests: (status?: string): Promise<Paginated<CategoryRequestItem>> =>
    apiClient.getPage<CategoryRequestItem>('admin/category-requests', {
      query: { status: status || undefined },
    }),
  approveCategoryRequest: (id: string) =>
    apiClient.patch<CategoryRequestItem>(`admin/category-requests/${id}/approve`),
  rejectCategoryRequest: (id: string, note?: string) =>
    apiClient.patch<CategoryRequestItem>(`admin/category-requests/${id}/reject`, { note }),

  customers: (f?: ListFilters): Promise<Paginated<AdminCustomer>> =>
    apiClient.getPage<AdminCustomer>('admin/customers', { query: toQuery(f) }),
  setCustomerStatus: (id: string, status: string) =>
    apiClient.patch<AdminCustomer>(`admin/customers/${id}/status`, { status }),

  offers: (f?: ListFilters): Promise<Paginated<AdminOffer>> =>
    apiClient.getPage<AdminOffer>('admin/offers', { query: toQuery(f) }),
  setOfferStatus: (id: string, status: string) =>
    apiClient.patch<AdminOffer>(`admin/offers/${id}/status`, { status }),

  reviews: (f?: ListFilters): Promise<Paginated<AdminReview>> =>
    apiClient.getPage<AdminReview>('admin/reviews', { query: toQuery(f) }),
  setReviewStatus: (id: string, status: string) =>
    apiClient.patch<AdminReview>(`admin/reviews/${id}/status`, { status }),

  plans: () => apiClient.get<Plan[]>('admin/plans'),
  updatePlan: (key: string, payload: Record<string, unknown>) =>
    apiClient.patch<Plan>(`admin/plans/${key}`, payload),

  broadcast: (payload: { title: string; body?: string; target: string; link?: string }) =>
    apiClient.post<{ sent: number }>('admin/broadcast', payload),

  featureFlags: () => apiClient.get<FeatureFlag[]>('admin/feature-flags'),
  setFeatureFlag: (key: string, enabled: boolean) =>
    apiClient.patch<FeatureFlag>(`admin/feature-flags/${key}`, { enabled }),

  settings: () => apiClient.get<PlatformSettings>('admin/settings'),
  updateSettings: (payload: Partial<PlatformSettings>) =>
    apiClient.put<PlatformSettings>('admin/settings', payload),

  cmsPages: () => apiClient.get<CmsPage[]>('admin/cms'),
  updateCms: (slug: string, payload: { title: string; body?: string; status?: string }) =>
    apiClient.put<CmsPage>(`admin/cms/${slug}`, payload),

  auditLogs: (f?: ListFilters): Promise<Paginated<AuditLog>> =>
    apiClient.getPage<AuditLog>('admin/audit-logs', {
      query: { action: f?.search || undefined, page: f?.page, perPage: f?.perPage },
    }),

  /** Download a CSV report as a file (bypasses the JSON envelope). */
  async downloadReport(type: string): Promise<void> {
    const base = apiConfig.baseUrl.replace(/\/$/, '')
    const token = getAuthToken()
    const res = await fetch(`${base}/admin/reports/${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Export failed. Please try again.')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listee-${type}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
