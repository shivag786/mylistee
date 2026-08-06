import {
  LayoutDashboard,
  Tag,
  BarChart3,
  CreditCard,
  ScanLine,
  QrCode,
  Store,
  MessageSquare,
  Coins,
  Package,
  Layers,
  Megaphone,
  ClipboardList,
  Armchair,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

/**
 * Toggleable owner-menu modules — mirrors backend config/owner_modules.php. An
 * admin can hide any of these from every owner; items WITHOUT a module (Dashboard,
 * Plan & billing, Business profile) are core and always shown.
 */
export type OwnerModuleId =
  | 'orders'
  | 'products'
  | 'tables'
  | 'combos'
  | 'grow_sales'
  | 'loyalty'
  | 'redeem'
  | 'spin_rewards'
  | 'analytics'
  | 'reviews'
  | 'qr'

export interface OwnerNavItem {
  to: string
  /** Full label for the desktop sidebar. */
  label: string
  /** Compact label for the mobile bottom nav. */
  shortLabel: string
  icon: LucideIcon
  /** Hidden from the mobile bottom nav (still on the desktop sidebar). */
  desktopOnly?: boolean
  /** Admin-toggleable module id; absent ⇒ core item, always shown. */
  module?: OwnerModuleId
}

/**
 * Business-owner navigation — the single source for both the desktop sidebar and
 * the mobile bottom nav (document/phase/07). Every feature is listed here.
 */
export const OWNER_NAV: OwnerNavItem[] = [
  { to: ROUTES.owner.dashboard, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: ROUTES.owner.orders, label: 'Orders', shortLabel: 'Orders', icon: ClipboardList, module: 'orders' },
  { to: ROUTES.owner.products, label: 'Products', shortLabel: 'Menu', icon: Package, module: 'products' },
  { to: ROUTES.owner.tables, label: 'Tables & service', shortLabel: 'Tables', icon: Armchair, desktopOnly: true, module: 'tables' },
  { to: ROUTES.owner.combos, label: 'Combos', shortLabel: 'Combos', icon: Layers, desktopOnly: true, module: 'combos' },
  { to: ROUTES.owner.growSales, label: 'Grow sales', shortLabel: 'Grow', icon: Megaphone, module: 'grow_sales' },
  { to: ROUTES.owner.loyalty, label: 'Loyalty', shortLabel: 'Coins', icon: Coins, module: 'loyalty' },
  { to: ROUTES.owner.redeem, label: 'Redeem', shortLabel: 'Redeem', icon: ScanLine, module: 'redeem' },
  { to: ROUTES.owner.offers, label: 'Spin rewards', shortLabel: 'Rewards', icon: Tag, desktopOnly: true, module: 'spin_rewards' },
  { to: ROUTES.owner.analytics, label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, desktopOnly: true, module: 'analytics' },
  { to: ROUTES.owner.reviews, label: 'Reviews', shortLabel: 'Reviews', icon: MessageSquare, desktopOnly: true, module: 'reviews' },
  { to: ROUTES.owner.subscription, label: 'Plan & billing', shortLabel: 'Plan', icon: CreditCard, desktopOnly: true },
  { to: ROUTES.owner.qr, label: 'QR code', shortLabel: 'QR', icon: QrCode, desktopOnly: true, module: 'qr' },
  { to: ROUTES.owner.profile, label: 'Business profile', shortLabel: 'Business', icon: Store, desktopOnly: true },
]

/** Items shown in the mobile bottom nav (Plan & billing lives on the dashboard/profile there). */
export const OWNER_MOBILE_NAV = OWNER_NAV.filter((item) => !item.desktopOnly)

/** A module is on unless the admin explicitly disabled it (missing ⇒ on). */
export function isOwnerModuleEnabled(modules: Record<string, boolean> | undefined, id?: OwnerModuleId): boolean {
  if (!id) return true
  return modules?.[id] !== false
}

/** Filter a nav list to the modules the admin has enabled. */
export function visibleOwnerNav(items: OwnerNavItem[], modules: Record<string, boolean> | undefined): OwnerNavItem[] {
  return items.filter((item) => isOwnerModuleEnabled(modules, item.module))
}
