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
  Users,
  Contact,
  Clapperboard,
  BellRing,
  Gift,
  Link2,
  Settings,
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
  | 'customers'
  | 'reels'
  | 'qr'
  | 'notifications'

export interface OwnerNavItem {
  to: string
  /** Full label for the desktop sidebar. */
  label: string
  /** Compact label for the mobile bottom nav. */
  shortLabel: string
  icon: LucideIcon
  /**
   * Shown in the horizontal bottom nav on mobile. Everything else lives in the
   * side menu — the desktop sidebar, or the drawer behind the mobile menu
   * button — so every page stays reachable on a phone.
   */
  bottomNav?: boolean
  /** Admin-toggleable module id; absent ⇒ core item, always shown. */
  module?: OwnerModuleId
}

/**
 * Business-owner navigation — the single source for both the desktop sidebar and
 * the mobile bottom nav (document/phase/07). Every feature is listed here.
 */
export const OWNER_NAV: OwnerNavItem[] = [
  { to: ROUTES.owner.dashboard, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, bottomNav: true },
  { to: ROUTES.owner.products, label: 'Products', shortLabel: 'Product', icon: Package, bottomNav: true, module: 'products' },
  { to: ROUTES.owner.combos, label: 'Combos', shortLabel: 'Combo', icon: Layers, bottomNav: true, module: 'combos' },
  { to: ROUTES.owner.orders, label: 'Orders', shortLabel: 'Order', icon: ClipboardList, bottomNav: true, module: 'orders' },
  { to: ROUTES.owner.profile, label: 'Business profile', shortLabel: 'Profile', icon: Store, bottomNav: true },
  // Core and near the top: a paid add-on owners must find easily.
  { to: ROUTES.owner.personalLink, label: 'Personal link', shortLabel: 'My link', icon: Link2 },
  { to: ROUTES.owner.settings, label: 'Settings', shortLabel: 'Settings', icon: Settings },
  { to: ROUTES.owner.tables, label: 'Tables & service', shortLabel: 'Tables', icon: Armchair, module: 'tables' },
  { to: ROUTES.owner.redeem, label: 'Redeem', shortLabel: 'Redeem', icon: ScanLine, module: 'redeem' },
  { to: ROUTES.owner.reels, label: 'Reels', shortLabel: 'Reels', icon: Clapperboard, module: 'reels' },
  { to: ROUTES.owner.customers, label: 'Customers', shortLabel: 'Customers', icon: Contact, module: 'customers' },
  { to: ROUTES.owner.reviews, label: 'Reviews', shortLabel: 'Reviews', icon: MessageSquare, module: 'reviews' },
  { to: ROUTES.owner.followers, label: 'Followers', shortLabel: 'Followers', icon: Users },
  { to: ROUTES.owner.analytics, label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, module: 'analytics' },
  { to: ROUTES.owner.subscription, label: 'Plan & billing', shortLabel: 'Plan', icon: CreditCard },
  { to: ROUTES.owner.rewards, label: 'Rewards & coupons', shortLabel: 'Rewards', icon: Gift, module: 'loyalty' },
  { to: ROUTES.owner.growSales, label: 'Grow sales', shortLabel: 'Grow', icon: Megaphone, module: 'grow_sales' },
  { to: ROUTES.owner.notify, label: 'Notify customers', shortLabel: 'Notify', icon: BellRing, module: 'notifications' },
  { to: ROUTES.owner.loyalty, label: 'Loyalty', shortLabel: 'Coins', icon: Coins, module: 'loyalty' },
  { to: ROUTES.owner.offers, label: 'Spin rewards', shortLabel: 'Rewards', icon: Tag, module: 'spin_rewards' },
  { to: ROUTES.owner.qr, label: 'QR code', shortLabel: 'QR', icon: QrCode, module: 'qr' },
]

/** The five horizontal tabs: Home, Product, Combo, Order, Profile. */
export const OWNER_MOBILE_NAV = OWNER_NAV.filter((item) => item.bottomNav)

/** A module is on unless the admin explicitly disabled it (missing ⇒ on). */
export function isOwnerModuleEnabled(modules: Record<string, boolean> | undefined, id?: OwnerModuleId): boolean {
  if (!id) return true
  return modules?.[id] !== false
}

/** Filter a nav list to the modules the admin has enabled. */
export function visibleOwnerNav(items: OwnerNavItem[], modules: Record<string, boolean> | undefined): OwnerNavItem[] {
  return items.filter((item) => isOwnerModuleEnabled(modules, item.module))
}
