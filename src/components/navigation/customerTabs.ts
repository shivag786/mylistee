import { Home, MapPin, Wallet, ReceiptIndianRupee, User, Tag } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { TabBarItem } from './TabBar'

// Customer navigation — capped at 5 tabs on the phone (document/phase/05 §Navigation).
export const CUSTOMER_TABS: TabBarItem[] = [
  { to: ROUTES.home, label: 'Home', icon: Home, end: true },
  { to: ROUTES.nearby, label: 'Nearby', icon: MapPin },
  { to: ROUTES.orders, label: 'Orders', icon: ReceiptIndianRupee },
  { to: ROUTES.wallet, label: 'Wallet', icon: Wallet },
  { to: ROUTES.profile, label: 'Profile', icon: User },
]

/** Desktop header links: the phone tabs plus Deals, minus Profile (that's the avatar). */
export const CUSTOMER_DESKTOP_TABS: TabBarItem[] = [
  CUSTOMER_TABS[0],
  CUSTOMER_TABS[1],
  { to: ROUTES.deals, label: 'Deals', icon: Tag },
  CUSTOMER_TABS[2],
  CUSTOMER_TABS[3],
]
