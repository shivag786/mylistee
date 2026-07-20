/**
 * TanStack Query hooks for the business-owner feature. Server state lives here,
 * not in React state (document/phase/03 §State Management).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/types/api'
import { analyticsService } from '../services/analyticsService'
import { categoryService } from '../services/categoryService'
import { offerService } from '../services/offerService'
import { ownerService } from '../services/ownerService'
import { subscriptionService } from '../services/subscriptionService'
import type {
  AnalyticsData,
  BusinessFormValues,
  DashboardData,
  Invoice,
  Offer,
  OfferFormValues,
  OwnerBusiness,
  Plan,
  SubscriptionState,
} from '../types'

export const ownerKeys = {
  business: ['owner', 'business'] as const,
  dashboard: ['owner', 'dashboard'] as const,
  offers: ['owner', 'offers'] as const,
  analytics: (days: number) => ['owner', 'analytics', days] as const,
  subscription: ['owner', 'subscription'] as const,
  plans: ['plans'] as const,
  invoices: ['owner', 'invoices'] as const,
  categories: ['categories'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: ownerKeys.categories,
    queryFn: () => categoryService.list(),
    staleTime: 1000 * 60 * 60, // categories rarely change
  })
}

/**
 * The owner's business, or `null` when they haven't registered one yet
 * (a 404 is an expected "no business" signal, not an error).
 */
export function useOwnerBusiness() {
  return useQuery<OwnerBusiness | null>({
    queryKey: ownerKeys.business,
    queryFn: async () => {
      try {
        return await ownerService.getProfile()
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
  })
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ownerKeys.dashboard,
    queryFn: () => ownerService.getDashboard(),
  })
}

/** Analytics for the selected look-back window (Milestone 12). */
export function useAnalytics(days: number) {
  return useQuery<AnalyticsData>({
    queryKey: ownerKeys.analytics(days),
    queryFn: () => analyticsService.get(days),
    placeholderData: (prev) => prev, // keep the chart while a new range loads
  })
}

/** Current plan, subscription and usage (Milestone 13). */
export function useSubscription() {
  return useQuery<SubscriptionState>({
    queryKey: ownerKeys.subscription,
    queryFn: () => subscriptionService.getState(),
  })
}

/** Public list of plans for the comparison / upgrade screen. */
export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ownerKeys.plans,
    queryFn: () => subscriptionService.listPlans(),
    staleTime: 1000 * 60 * 30,
  })
}

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ownerKeys.invoices,
    queryFn: () => subscriptionService.listInvoices(),
  })
}

function invalidateSubscription(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ownerKeys.subscription })
  void qc.invalidateQueries({ queryKey: ownerKeys.invoices })
  void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
  void qc.invalidateQueries({ queryKey: ownerKeys.offers })
}

/** Subscribe to / upgrade to a plan (payment placeholder). */
export function useSubscribe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planKey: string) => subscriptionService.subscribe(planKey),
    onSuccess: (state) => {
      qc.setQueryData(ownerKeys.subscription, state)
      invalidateSubscription(qc)
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionService.cancel(),
    onSuccess: (state) => {
      qc.setQueryData(ownerKeys.subscription, state)
      invalidateSubscription(qc)
    },
  })
}

export function useRegisterBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BusinessFormValues) => ownerService.register(values),
    onSuccess: (business) => {
      qc.setQueryData(ownerKeys.business, business)
      void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
    },
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<BusinessFormValues>) => ownerService.updateProfile(values),
    onSuccess: (business) => {
      qc.setQueryData(ownerKeys.business, business)
      void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
    },
  })
}

export function useAddGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (image: File) => ownerService.addGalleryImage(image),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ownerKeys.business })
      void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
    },
  })
}

export function useRemoveGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ownerService.removeGalleryImage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ownerKeys.business })
    },
  })
}

export function useRecordQrDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ownerService.recordQrDownload(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ownerKeys.business })
    },
  })
}

export function useOffers() {
  return useQuery<Offer[]>({
    queryKey: ownerKeys.offers,
    queryFn: () => offerService.list(),
  })
}

function invalidateOffers(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ownerKeys.offers })
  void qc.invalidateQueries({ queryKey: ownerKeys.dashboard })
}

export function useCreateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: OfferFormValues) => offerService.create(values),
    onSuccess: () => invalidateOffers(qc),
  })
}

export function useUpdateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<OfferFormValues> }) =>
      offerService.update(id, values),
    onSuccess: () => invalidateOffers(qc),
  })
}

export function useSetOfferStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'archived' }) =>
      offerService.setStatus(id, status),
    onSuccess: () => invalidateOffers(qc),
  })
}

export function useDeleteOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => offerService.remove(id),
    onSuccess: () => invalidateOffers(qc),
  })
}
