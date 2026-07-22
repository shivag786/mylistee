/**
 * Product catalogue API (Phase 7.2). Create/update send multipart FormData for
 * the image; updates use POST + `_method=PUT` (PHP can't parse multipart on PUT).
 * Service-layer rule: UI never calls the API directly (document/phase/04).
 */
import { apiClient } from '@/services/apiClient'
import type {
  Product,
  ProductCategory,
  ProductFormValues,
  ProductToggleField,
} from '../productTypes'

/** Map form values (camelCase) to the API's snake_case FormData, skipping blanks. */
function toFormData(values: Partial<ProductFormValues>): FormData {
  const form = new FormData()
  const map: Record<string, unknown> = {
    name: values.name,
    product_category_id: values.categoryId,
    category_name: values.categoryName,
    description: values.description,
    ingredients: values.ingredients,
    mrp: values.mrp,
    selling_price: values.sellingPrice,
    food_type: values.foodType,
    available_from: values.availableFrom,
    available_to: values.availableTo,
    prep_minutes: values.prepMinutes,
  }
  for (const [key, value] of Object.entries(map)) {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value))
  }
  // Booleans are always sent (may be false).
  const flags: Array<[string, boolean | undefined]> = [
    ['is_todays_special', values.isTodaysSpecial],
    ['is_bestseller', values.isBestseller],
    ['is_recommended', values.isRecommended],
    ['in_stock', values.inStock],
    ['is_visible', values.isVisible],
  ]
  for (const [key, value] of flags) {
    if (value !== undefined) form.append(key, value ? '1' : '0')
  }
  if (values.image) form.append('image', values.image)
  return form
}

export const productService = {
  list: (): Promise<Product[]> => apiClient.get<Product[]>('business/products'),

  create: (values: ProductFormValues): Promise<Product> =>
    apiClient.post<Product>('business/products', toFormData(values)),

  update: (id: string, values: Partial<ProductFormValues>): Promise<Product> => {
    const form = toFormData(values)
    form.append('_method', 'PUT')
    return apiClient.post<Product>(`business/products/${id}`, form)
  },

  remove: (id: string): Promise<void> => apiClient.delete(`business/products/${id}`).then(() => undefined),

  toggle: (id: string, field: ProductToggleField, value: boolean): Promise<Product> =>
    apiClient.patch<Product>(`business/products/${id}/toggle`, { field, value }),

  reorder: (order: string[]): Promise<Product[]> =>
    apiClient.patch<Product[]>('business/products/reorder', { order }),

  addImage: (id: string, image: File): Promise<Product> => {
    const form = new FormData()
    form.append('image', image)
    return apiClient.post<Product>(`business/products/${id}/images`, form)
  },

  removeImage: (id: string, imageId: string): Promise<Product> =>
    apiClient.delete<Product>(`business/products/${id}/images/${imageId}`),

  // Menu sections
  categories: (): Promise<ProductCategory[]> =>
    apiClient.get<ProductCategory[]>('business/product-categories'),

  createCategory: (name: string): Promise<ProductCategory> =>
    apiClient.post<ProductCategory>('business/product-categories', { name }),

  updateCategory: (id: string, name: string): Promise<ProductCategory> =>
    apiClient.put<ProductCategory>(`business/product-categories/${id}`, { name }),

  removeCategory: (id: string): Promise<void> =>
    apiClient.delete(`business/product-categories/${id}`).then(() => undefined),

  reorderCategories: (order: string[]): Promise<ProductCategory[]> =>
    apiClient.patch<ProductCategory[]>('business/product-categories/reorder', { order }),
}
