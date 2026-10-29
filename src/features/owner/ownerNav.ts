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
  MessageCircle,
  Gift,
  Link2,
  Settings,
  Printer,
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
  | 'rewards'
  | 'loyalty'
  | 'redeem'
  | 'spin_rewards'
  | 'analytics'
  | 'reviews'
  | 'customers'
  | 'reels'
  | 'qr'
  | 'notifications'
  | 'whatsapp'

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
  /** The sidebar heading this item sits under. */
  group: OwnerNavGroup
}

/** Sidebar headings, in the order they appear. */
export type OwnerNavGroup = 'Home' | 'Orders' | 'Menu' | 'Grow' | 'Reach customers' | 'Customers' | 'Insights' | 'Account'

/**
 * Business-owner navigation — the single source for both the desktop sidebar and
 * the mobile bottom nav (document/phase/07). Every feature is listed here.
 */
export const OWNER_NAV: OwnerNavItem[] = [
  { to: ROUTES.owner.dashboard, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, bottomNav: true, group: 'Home' },

  { to: ROUTES.owner.orders, label: 'Orders', shortLabel: 'Order', icon: ClipboardList, bottomNav: true, module: 'orders', group: 'Orders' },
  { to: ROUTES.owner.pos, label: 'POS · New bill', shortLabel: 'POS', icon: Printer, module: 'orders', group: 'Orders' },
  { to: ROUTES.owner.tables, label: 'Tables & service', shortLabel: 'Tables', icon: Armchair, module: 'tables', group: 'Orders' },

  { to: ROUTES.owner.products, label: 'Products', shortLabel: 'Product', icon: Package, bottomNav: true, module: 'products', group: 'Menu' },
  { to: ROUTES.owner.combos, label: 'Combos', shortLabel: 'Combo', icon: Layers, bottomNav: true, module: 'combos', group: 'Menu' },

  { to: ROUTES.owner.rewards, label: 'Rewards & coupons', shortLabel: 'Rewards', icon: Gift, module: 'rewards', group: 'Grow' },
  { to: ROUTES.owner.loyalty, label: 'Loyalty coins', shortLabel: 'Coins', icon: Coins, module: 'loyalty', group: 'Grow' },
  { to: ROUTES.owner.offers, label: 'Spin rewards', shortLabel: 'Spin', icon: Tag, module: 'spin_rewards', group: 'Grow' },
  { to: ROUTES.owner.growSales, label: 'Grow sales', shortLabel: 'Grow', icon: Megaphone, module: 'grow_sales', group: 'Grow' },
  { to: ROUTES.owner.redeem, label: 'Redeem', shortLabel: 'Redeem', icon: ScanLine, module: 'redeem', group: 'Grow' },

  { to: ROUTES.owner.notify, label: 'Notify customers', shortLabel: 'Notify', icon: BellRing, module: 'notifications', group: 'Reach customers' },
  { to: ROUTES.owner.whatsapp, label: 'WhatsApp offers', shortLabel: 'WhatsApp', icon: MessageCircle, module: 'whatsapp', group: 'Reach customers' },
  { to: ROUTES.owner.reels, label: 'Reels', shortLabel: 'Reels', icon: Clapperboard, module: 'reels', group: 'Reach customers' },
  { to: ROUTES.owner.qr, label: 'QR code', shortLabel: 'QR', icon: QrCode, module: 'qr', group: 'Reach customers' },
  // Core: a paid add-on owners must find easily.
  { to: ROUTES.owner.personalLink, label: 'Personal link', shortLabel: 'My link', icon: Link2, group: 'Reach customers' },

  { to: ROUTES.owner.customers, label: 'Customers', shortLabel: 'Customers', icon: Contact, module: 'customers', group: 'Customers' },
  { to: ROUTES.owner.followers, label: 'Followers', shortLabel: 'Followers', icon: Users, group: 'Customers' },
  { to: ROUTES.owner.reviews, label: 'Reviews', shortLabel: 'Reviews', icon: MessageSquare, module: 'reviews', group: 'Customers' },

  { to: ROUTES.owner.analytics, label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, module: 'analytics', group: 'Insights' },

  { to: ROUTES.owner.profile, label: 'Business profile', shortLabel: 'Profile', icon: Store, bottomNav: true, group: 'Account' },
  { to: ROUTES.owner.settings, label: 'Settings', shortLabel: 'Settings', icon: Settings, group: 'Account' },
  { to: ROUTES.owner.subscription, label: 'Plan & billing', shortLabel: 'Plan', icon: CreditCard, group: 'Account' },
]

/** Items under their headings, keeping the order above; empty headings dropped. */
export function groupOwnerNav(items: OwnerNavItem[]): { group: OwnerNavGroup; items: OwnerNavItem[] }[] {
  const groups: { group: OwnerNavGroup; items: OwnerNavItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.group === item.group) last.items.push(item)
    else groups.push({ group: item.group, items: [item] })
  }
  return groups
}

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
