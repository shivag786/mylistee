/** TanStack Query hooks for the owner's customer book. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerService, type ShopCustomerInput } from '../services/customerService'

const customersKey = ['owner', 'customers'] as const

export function useShopCustomers(search: string, page: number) {
  return useQuery({
    queryKey: [...customersKey, { search, page }],
    queryFn: () => customerService.list({ search, page }),
    // Keep the current rows on screen while the next search/page loads.
    placeholderData: keepPreviousData,
  })
}

export function useCreateShopCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ShopCustomerInput) => customerService.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: customersKey }),
  })
}

export function useUpdateShopCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ShopCustomerInput }) => customerService.update(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: customersKey }),
  })
}

export function useDeleteShopCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: customersKey }),
  })
}
