import { useContext } from 'react'
import { LocationContext, type LocationValue } from './locationContext'

/**
 * The app-wide location. Named `useAppLocation`, not `useLocation`, to avoid
 * shadowing react-router's hook of that name.
 */
export function useAppLocation(): LocationValue {
  const value = useContext(LocationContext)
  if (!value) throw new Error('useAppLocation must be used inside a LocationProvider')
  return value
}
