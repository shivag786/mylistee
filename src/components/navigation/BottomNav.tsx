import { ROUTES } from '@/constants/routes'
import { useCustomerHomePath } from '@/features/landing/homeEntry'
import { TabBar } from './TabBar'
import { CUSTOMER_TABS } from './customerTabs'

export function BottomNav() {
  // While `/` is the landing page, "Home" means the shop feed at /explore.
  const homePath = useCustomerHomePath()
  const items = CUSTOMER_TABS.map((t) => (t.to === ROUTES.home ? { ...t, to: homePath } : t))
  return <TabBar items={items} label="Primary" id="customer-tab" />
}
