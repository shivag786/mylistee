import type { UserRole } from '@/types/common'

export type UserStatus = 'active' | 'suspended' | 'pending'

export interface AuthUser {
  id: string
  name: string
  email: string
  photoUrl: string | null
  phone: string | null
  role: UserRole
  status: UserStatus
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated'
