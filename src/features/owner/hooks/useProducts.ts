/**
 * TanStack Query hooks for the product catalogue (Phase 7.2). Server state lives
 * here; mutations invalidate the product + menu-section lists.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productService'
import type { Product, ProductCategory, ProductFormValues, ProductToggleField } from '../productTypes'

export const productKeys = {
  products: ['owner', 'products'] as const,
  categories: ['owner', 'product-categories'] as const,
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: productKeys.products,
    queryFn: () => productService.list(),
  })
}

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: productKeys.categories,
    queryFn: () => productService.categories(),
  })
}

export function useProductActions() {
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: productKeys.products })
    void qc.invalidateQueries({ queryKey: productKeys.categories })
  }

  return {
    create: useMutation({
      mutationFn: (values: ProductFormValues) => productService.create(values),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; values: Partial<ProductFormValues> }) =>
        productService.update(v.id, v.values),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => productService.remove(id),
      onSuccess: done,
    }),
    toggle: useMutation({
      mutationFn: (v: { id: string; field: ProductToggleField; value: boolean }) =>
        productService.toggle(v.id, v.field, v.value),
      onSuccess: done,
    }),
    reorder: useMutation({
      mutationFn: (order: string[]) => productService.reorder(order),
      onSuccess: done,
    }),
    addImage: useMutation({
      mutationFn: (v: { id: string; image: File }) => productService.addImage(v.id, v.image),
      onSuccess: done,
    }),
    removeImage: useMutation({
      mutationFn: (v: { id: string; imageId: string }) => productService.removeImage(v.id, v.imageId),
      onSuccess: done,
    }),
  }
}
