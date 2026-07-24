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
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface OwnerNavItem {
  to: string
  /** Full label for the desktop sidebar. */
  label: string
  /** Compact label for the mobile bottom nav. */
  shortLabel: string
  icon: LucideIcon
  /** Hidden from the mobile bottom nav (still on the desktop sidebar). */
  desktopOnly?: boolean
}

/**
 * Business-owner navigation — the single source for both the desktop sidebar and
 * the mobile bottom nav (document/phase/07). Every feature is listed here.
 */
export const OWNER_NAV: OwnerNavItem[] = [
  { to: ROUTES.owner.dashboard, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: ROUTES.owner.orders, label: 'Orders', shortLabel: 'Orders', icon: ClipboardList },
  { to: ROUTES.owner.products, label: 'Products', shortLabel: 'Menu', icon: Package },
  { to: ROUTES.owner.combos, label: 'Combos', shortLabel: 'Combos', icon: Layers, desktopOnly: true },
  { to: ROUTES.owner.growSales, label: 'Grow sales', shortLabel: 'Grow', icon: Megaphone },
  { to: ROUTES.owner.loyalty, label: 'Loyalty', shortLabel: 'Coins', icon: Coins },
  { to: ROUTES.owner.redeem, label: 'Redeem', shortLabel: 'Redeem', icon: ScanLine },
  { to: ROUTES.owner.offers, label: 'Spin rewards', shortLabel: 'Rewards', icon: Tag, desktopOnly: true },
  { to: ROUTES.owner.analytics, label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, desktopOnly: true },
  { to: ROUTES.owner.reviews, label: 'Reviews', shortLabel: 'Reviews', icon: MessageSquare, desktopOnly: true },
  { to: ROUTES.owner.subscription, label: 'Plan & billing', shortLabel: 'Plan', icon: CreditCard, desktopOnly: true },
  { to: ROUTES.owner.qr, label: 'QR code', shortLabel: 'QR', icon: QrCode, desktopOnly: true },
  { to: ROUTES.owner.profile, label: 'Business profile', shortLabel: 'Business', icon: Store, desktopOnly: true },
]

/** Items shown in the mobile bottom nav (Plan & billing lives on the dashboard/profile there). */
export const OWNER_MOBILE_NAV = OWNER_NAV.filter((item) => !item.desktopOnly)
