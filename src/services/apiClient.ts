/**
 * The single HTTP gateway to the Laravel API. Every feature service builds on
 * this — UI components must NEVER call fetch/axios directly (document/phase/03
 * §API Communication, phase/04 §Service Layer).
 *
 * Responsibilities:
 *  - Attach the Sanctum bearer token.
 *  - Enforce a request timeout.
 *  - Unwrap the standard { success, message, data } envelope.
 *  - Normalize every failure into a typed ApiError for the UI.
 */
import { apiConfig } from '@/config/api.config'
import { ApiError, type ApiResponse, type Paginated } from '@/types/api'
import { storage } from '@/utils/storage'

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  query?: Query
  signal?: AbortSignal
  /** Skip attaching the auth token (e.g. public endpoints). */
  auth?: boolean
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(
    path.replace(/^\//, ''),
    apiConfig.baseUrl.endsWith('/') ? apiConfig.baseUrl : `${apiConfig.baseUrl}/`,
  )
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function getAuthToken(): string | null {
  return storage.get(apiConfig.tokenStorageKey)
}

export function setAuthToken(token: string | null): void {
  if (token) storage.set(apiConfig.tokenStorageKey, token)
  else storage.remove(apiConfig.tokenStorageKey)
}

/**
 * Registered by AuthContext so an expired/revoked session (401 on an
 * authenticated request) tears down auth state app-wide. The token is cleared
 * here before the handler runs so the redirect to login is clean.
 */
type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

/** Perform a request and return the full envelope (data + meta). */
async function rawRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { query, signal, auth = true } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs)
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

  // FormData (file uploads) must be sent raw so the browser sets the multipart
  // boundary; JSON bodies are serialized and carry the default headers.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const headers: Record<string, string> = { ...apiConfig.defaultHeaders }
  if (isFormData) delete headers['Content-Type']
  if (auth) {
    const token = getAuthToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'include',
    })
  } catch (error) {
    clearTimeout(timeout)
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    throw new ApiError(
      aborted
        ? 'The request timed out. Please try again.'
        : "You're offline. Please check your connection.",
      0,
    )
  }
  clearTimeout(timeout)

  // 204 No Content
  if (response.status === 204) {
    return { success: true, message: '', data: undefined as T, meta: null }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    // A 401 on an authenticated request means the session is gone — clear it
    // and let the app react (redirect to login) exactly once.
    if (response.status === 401 && auth) {
      setAuthToken(null)
      unauthorizedHandler?.()
    }
    const err = payload as { message?: string; errors?: Record<string, string[]> } | null
    throw new ApiError(
      err?.message ?? 'Something went wrong. Please try again.',
      response.status,
      err?.errors,
    )
  }

  return payload as ApiResponse<T>
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return (await rawRequest<T>(method, path, body, options)).data
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),

  /** GET a paginated collection, preserving the envelope's `meta`. */
  getPage: async <T>(path: string, options?: RequestOptions): Promise<Paginated<T>> => {
    const env = await rawRequest<T[]>('GET', path, undefined, options)
    return {
      items: env.data ?? [],
      meta: env.meta ?? { currentPage: 1, lastPage: 1, perPage: 0, total: (env.data ?? []).length },
    }
  },
}
