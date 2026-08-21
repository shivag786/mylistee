import {
  LayoutDashboard,
  Store,
  DownloadCloud,
  Users,
  Tag,
  Star,
  CreditCard,
  IndianRupee,
  Receipt,
  Megaphone,
  GalleryHorizontalEnd,
  Flag,
  FileText,
  ShieldAlert,
  ScrollText,
  Settings,
  Download,
  Grid3x3,
  Inbox,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Super Admin navigation (document/phase/14). Order = information priority. */
export const ADMIN_NAV: AdminNavItem[] = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.admin.businesses, label: 'Businesses', icon: Store },
  { to: ROUTES.admin.businessImport, label: 'Business import', icon: DownloadCloud },
  { to: ROUTES.admin.categories, label: 'Categories', icon: Grid3x3 },
  { to: ROUTES.admin.categoryRequests, label: 'Category requests', icon: Inbox },
  { to: ROUTES.admin.customers, label: 'Customers', icon: Users },
  { to: ROUTES.admin.offers, label: 'Offers', icon: Tag },
  { to: ROUTES.admin.reviews, label: 'Reviews', icon: Star },
  { to: ROUTES.admin.plans, label: 'Plans', icon: CreditCard },
  { to: ROUTES.admin.revenue, label: 'Revenue', icon: IndianRupee },
  { to: ROUTES.admin.payments, label: 'Payments', icon: Receipt },
  { to: ROUTES.admin.broadcast, label: 'Broadcast', icon: Megaphone },
  { to: ROUTES.admin.banners, label: 'Home banners', icon: GalleryHorizontalEnd },
  { to: ROUTES.admin.featureFlags, label: 'Feature flags', icon: Flag },
  { to: ROUTES.admin.ownerMenu, label: 'Owner menu', icon: PanelLeft },
  { to: ROUTES.admin.cms, label: 'CMS pages', icon: FileText },
  { to: ROUTES.admin.fraud, label: 'Fraud', icon: ShieldAlert },
  { to: ROUTES.admin.auditLogs, label: 'Audit logs', icon: ScrollText },
  { to: ROUTES.admin.reports, label: 'Reports', icon: Download },
  { to: ROUTES.admin.settings, label: 'Settings', icon: Settings },
]
