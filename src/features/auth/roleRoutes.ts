import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/common'

/**
 * Where a user lands after signing in, based on role. Business owners enter the
 * owner app; admins enter the Super Admin panel (Milestone 14); customers land
 * on the customer home.
 */
export function landingPathForRole(role: UserRole): string {
  switch (role) {
    case 'business_owner':
      return ROUTES.owner.root
    case 'admin':
      return ROUTES.admin.dashboard
    case 'customer':
    default:
      return ROUTES.home
  }
}
