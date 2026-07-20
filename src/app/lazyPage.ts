import { lazy, type ComponentType } from 'react'

/**
 * Lazy-load a page by its named export (Milestone 15 — route code-splitting).
 * Each call becomes its own Vite chunk, loaded only when the route is visited,
 * so the owner and admin apps never ship in the customer's initial bundle.
 */
export function lazyPage<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  name: K,
): ComponentType {
  return lazy(async () => {
    const module = await loader()
    return { default: module[name] as ComponentType }
  })
}
