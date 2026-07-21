/**
 * Global auth state. On boot it (1) resolves any pending Google redirect
 * sign-in, then (2) restores the session from a stored token. Exposes Google
 * sign-in / sign-out and a dev-only login. Server state (profile details,
 * wallet) lives in TanStack Query, not here.
 */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthToken, setAuthToken, setUnauthorizedHandler } from '@/services/apiClient'
import type { UserRole } from '@/types/common'
import { authService } from '../services/authService'
import type { AuthSession, AuthStatus, AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<AuthUser>
  pinLogin: (identifier: string, pin: string) => Promise<AuthUser>
  registerOwner: (name: string, mobile: string, pin: string) => Promise<AuthUser>
  becomeOwner: () => Promise<AuthUser>
  devLogin: (email: string, name?: string, role?: UserRole) => Promise<AuthUser>
  signOut: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('initializing')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      // 1) Returning from a Google redirect? Complete it first.
      try {
        const redirected = await authService.completeRedirectSignIn()
        if (redirected) {
          if (!active) return
          setUser(redirected.user)
          setStatus('authenticated')
          return
        }
      } catch {
        // fall through to token restore
      }

      // 2) Restore an existing session from the stored token.
      if (!getAuthToken()) {
        if (active) setStatus('unauthenticated')
        return
      }
      try {
        const me = await authService.fetchMe()
        if (!active) return
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (!active) return
        setAuthToken(null)
        setStatus('unauthenticated')
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  // React to a 401 on any authenticated request (expired/revoked token).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
      queryClient.clear()
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const applySession = useCallback(
    (session: AuthSession) => {
      // Drop any cached server state from a previous session/user so the new
      // user always fetches fresh data (fixes e.g. a stale "no business" result
      // sending a real owner to registration).
      queryClient.clear()
      setUser(session.user)
      setStatus('authenticated')
      return session.user
    },
    [queryClient],
  )

  const signInWithGoogle = useCallback(
    async () => applySession(await authService.signInWithGoogle()),
    [applySession],
  )

  const pinLogin = useCallback(
    async (identifier: string, pin: string) =>
      applySession(await authService.pinLogin(identifier, pin)),
    [applySession],
  )

  const registerOwner = useCallback(
    async (name: string, mobile: string, pin: string) =>
      applySession(await authService.registerOwner(name, mobile, pin)),
    [applySession],
  )

  const becomeOwner = useCallback(async () => {
    const updated = await authService.becomeOwner()
    // Role changed — drop cached customer-scoped queries so owner data is fresh.
    queryClient.clear()
    setUser(updated)
    return updated
  }, [queryClient])

  const devLogin = useCallback(
    async (email: string, name?: string, role?: UserRole) =>
      applySession(await authService.devLogin(email, name, role)),
    [applySession],
  )

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      signInWithGoogle,
      pinLogin,
      registerOwner,
      becomeOwner,
      devLogin,
      signOut,
    }),
    [user, status, signInWithGoogle, pinLogin, registerOwner, becomeOwner, devLogin, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
