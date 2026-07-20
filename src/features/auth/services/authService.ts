/**
 * Auth service — the only place that orchestrates Firebase + the auth API.
 * Flow: Google (popup or redirect) → Firebase ID token → exchange with Laravel
 * for a Sanctum token (document/phase/12 §Firebase Login Flow). All Firebase
 * calls go through `firebaseAuth`; all HTTP goes through `apiClient`.
 */
import { apiClient, setAuthToken } from '@/services/apiClient'
import { isProduction } from '@/config/env'
import type { UserRole } from '@/types/common'
import {
  consumeRedirectResult,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutFromFirebase,
} from './firebaseAuth'
import type { AuthSession, AuthUser } from '../types'

async function exchangeIdToken(idToken: string): Promise<AuthSession> {
  const session = await apiClient.post<AuthSession>('auth/google', { idToken }, { auth: false })
  setAuthToken(session.token)
  return session
}

export const authService = {
  /**
   * Full Google sign-in. Resolves with the session (popup path) or throws
   * REDIRECT_IN_PROGRESS when the browser is navigating away to Google.
   */
  async signInWithGoogle(): Promise<AuthSession> {
    const idToken = await firebaseGoogleSignIn()
    return exchangeIdToken(idToken)
  },

  /**
   * Resolve a pending redirect sign-in on boot. Returns the session when the
   * user just returned from Google, or null when nothing is pending.
   */
  async completeRedirectSignIn(): Promise<AuthSession | null> {
    const idToken = await consumeRedirectResult()
    if (!idToken) return null
    return exchangeIdToken(idToken)
  },

  /** Public business-owner sign-up (mobile + PIN). Signs the new owner in. */
  async registerOwner(name: string, mobile: string, pin: string): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>(
      'auth/register-owner',
      { name, mobile, pin },
      { auth: false },
    )
    setAuthToken(session.token)
    return session
  },

  /** Mobile/email + PIN sign-in for business owners and admins. */
  async pinLogin(identifier: string, pin: string): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>(
      'auth/pin-login',
      { identifier, pin },
      { auth: false },
    )
    setAuthToken(session.token)
    return session
  },

  /** Local-only shortcut (disabled in production) for verifying the app. */
  async devLogin(email: string, name?: string, role?: UserRole): Promise<AuthSession> {
    if (isProduction) throw new Error('Dev login is disabled in production.')
    const session = await apiClient.post<AuthSession>(
      'auth/dev-login',
      { email, name, role },
      { auth: false },
    )
    setAuthToken(session.token)
    return session
  },

  async fetchMe(): Promise<AuthUser> {
    return apiClient.get<AuthUser>('auth/me')
  },

  async signOut(): Promise<void> {
    try {
      await apiClient.post('auth/logout')
    } finally {
      setAuthToken(null)
      await signOutFromFirebase()
    }
  },
}
