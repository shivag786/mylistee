/**
 * Which page `/` is. The admin chooses (Settings → Landing page): the shop feed,
 * or the landing page that explains Listee to customers and shop owners. The
 * landing page is for signed-out visitors only — someone already signed in
 * came for the shops, and the PWA opens on `/` every time, so they always get
 * the shop feed. The feed itself is always reachable at /explore.
 */
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAppConfig } from '@/hooks/useAppConfig'

const CACHE_KEY = 'listee:home-page'

function cachedChoice(): 'shops' | 'landing' | null {
  try {
    const v = localStorage.getItem(CACHE_KEY)
    return v === 'landing' || v === 'shops' ? v : null
  } catch {
    return null
  }
}

function remember(choice: 'shops' | 'landing') {
  try {
    localStorage.setItem(CACHE_KEY, choice)
  } catch {
    // Storage blocked: the next visit waits for the config again.
  }
}

/** The admin's choice: the live config, else the last one seen, else null (still loading). */
export function useHomeChoice(): 'shops' | 'landing' | null {
  const config = useAppConfig()
  if (config.data) {
    const choice = config.data.homePage === 'landing' ? 'landing' : 'shops'
    remember(choice)
    return choice
  }
  // An unreachable API must not leave `/` blank: fall back to the feed.
  if (config.isError) return cachedChoice() ?? 'shops'
  return cachedChoice()
}

/** True = show the landing page, false = the shop feed, null = not known yet. */
export function useShowsLanding(): boolean | null {
  const choice = useHomeChoice()
  const { isAuthenticated, status } = useAuth()

  if (choice === null) return null
  if (choice === 'shops') return false
  // A stored session is still being checked; don't flash the landing page at a signed-in user.
  if (status === 'initializing') return null
  return !isAuthenticated
}

/** Where the customer app's "Home" tab goes: /explore while `/` is the landing page. */
export function useCustomerHomePath(): string {
  const choice = useHomeChoice()
  const { isAuthenticated } = useAuth()
  return choice === 'landing' && !isAuthenticated ? ROUTES.explore : ROUTES.home
}
