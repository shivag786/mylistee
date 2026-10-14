import { TabBar } from './TabBar'
import { CUSTOMER_TABS } from './customerTabs'

export function BottomNav() {
  return <TabBar items={CUSTOMER_TABS} label="Primary" id="customer-tab" />
}
