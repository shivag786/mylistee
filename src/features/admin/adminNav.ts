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
  ShoppingBag,
  Megaphone,
  GalleryHorizontalEnd,
  LayoutList,
  Flag,
  FileText,
  ShieldAlert,
  ScrollText,
  Settings,
  Download,
  Grid3x3,
  Inbox,
  PanelLeft,
  Link2,
  MessageCircle,
  PanelTop,
  Globe,
  Sparkles,
  HeartPulse,
  ScanLine,
  CalendarClock,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export type AdminNavGroup = 'Home' | 'Shops' | 'People' | 'Sales & money' | 'Marketing' | 'Website & app' | 'Setup'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Section heading in the sidebar, like the owner panel's. */
  group: AdminNavGroup
}

/** Super Admin navigation (document/phase/14), in sidebar sections. */
export const ADMIN_NAV: AdminNavItem[] = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard, group: 'Home' },
  { to: ROUTES.admin.businesses, label: 'Businesses', icon: Store, group: 'Shops' },
  { to: ROUTES.admin.businessImport, label: 'Business import', icon: DownloadCloud, group: 'Shops' },
  { to: ROUTES.admin.categories, label: 'Categories', icon: Grid3x3, group: 'Shops' },
  { to: ROUTES.admin.categoryRequests, label: 'Category requests', icon: Inbox, group: 'Shops' },
  { to: ROUTES.admin.personalLinks, label: 'Personal links', icon: Link2, group: 'Shops' },
  { to: ROUTES.admin.vendorHealth, label: 'Vendor health', icon: HeartPulse, group: 'Shops' },
  { to: ROUTES.admin.qrScans, label: 'QR scans', icon: ScanLine, group: 'Shops' },
  { to: ROUTES.admin.enquiries, label: 'Enquiries', icon: PhoneCall, group: 'People' },
  { to: ROUTES.admin.customers, label: 'Customers', icon: Users, group: 'People' },
  { to: ROUTES.admin.reviews, label: 'Reviews', icon: Star, group: 'People' },
  { to: ROUTES.admin.fraud, label: 'Fraud', icon: ShieldAlert, group: 'People' },
  { to: ROUTES.admin.plans, label: 'Plans', icon: CreditCard, group: 'Sales & money' },
  { to: ROUTES.admin.subscriptions, label: 'Subscriptions', icon: CalendarClock, group: 'Sales & money' },
  { to: ROUTES.admin.revenue, label: 'Revenue', icon: IndianRupee, group: 'Sales & money' },
  { to: ROUTES.admin.orders, label: 'Orders', icon: ShoppingBag, group: 'Sales & money' },
  { to: ROUTES.admin.payments, label: 'Payments', icon: Receipt, group: 'Sales & money' },
  { to: ROUTES.admin.aiUsage, label: 'AI usage & packs', icon: Sparkles, group: 'Sales & money' },
  { to: ROUTES.admin.offers, label: 'Offers', icon: Tag, group: 'Marketing' },
  { to: ROUTES.admin.broadcast, label: 'Push notifications', icon: Megaphone, group: 'Marketing' },
  { to: ROUTES.admin.whatsapp, label: 'WhatsApp', icon: MessageCircle, group: 'Marketing' },
  { to: ROUTES.admin.banners, label: 'Home banners', icon: GalleryHorizontalEnd, group: 'Marketing' },
  { to: ROUTES.admin.landingPage, label: 'Landing page', icon: PanelTop, group: 'Website & app' },
  { to: ROUTES.admin.homeLayout, label: 'Home layout', icon: LayoutList, group: 'Website & app' },
  { to: ROUTES.admin.ownerMenu, label: 'Owner menu', icon: PanelLeft, group: 'Website & app' },
  { to: ROUTES.admin.cms, label: 'CMS pages', icon: FileText, group: 'Website & app' },
  { to: ROUTES.admin.seo, label: 'SEO', icon: Globe, group: 'Website & app' },
  { to: ROUTES.admin.featureFlags, label: 'Feature flags', icon: Flag, group: 'Setup' },
  { to: ROUTES.admin.auditLogs, label: 'Audit logs', icon: ScrollText, group: 'Setup' },
  { to: ROUTES.admin.reports, label: 'Reports', icon: Download, group: 'Setup' },
  { to: ROUTES.admin.settings, label: 'Settings', icon: Settings, group: 'Setup' },
]

/** Consecutive items of one section, in order. */
export function groupAdminNav(items: AdminNavItem[]): { group: AdminNavGroup; items: AdminNavItem[] }[] {
  const groups: { group: AdminNavGroup; items: AdminNavItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.group === item.group) last.items.push(item)
    else groups.push({ group: item.group, items: [item] })
  }
  return groups
}
