/** Primitive shared types used across features. */

export type ID = string

export type UserRole = 'customer' | 'business_owner' | 'admin'

export interface Timestamps {
  createdAt: string
  updatedAt: string
}

export interface GeoPoint {
  lat: number
  lng: number
}

/** Common async UI states so every screen can express them consistently. */
export type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'empty'
