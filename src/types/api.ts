/**
 * Shared API contract types. Mirrors the Laravel standard response envelope
 * (document/phase/03 §Error Handling, phase/04 §Response Format).
 */

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta | null
  errors?: Record<string, string[]> | null
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  status: number
}

export interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

/** Normalized error thrown by the API client and surfaced to the UI. */
export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}
