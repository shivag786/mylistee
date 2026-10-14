import { TabBar } from '@/components/navigation/TabBar'
import { OWNER_MOBILE_NAV, visibleOwnerNav } from '@/features/owner/ownerNav'
import { useAppConfig } from '@/hooks/useAppConfig'

/**
 * Bottom navigation for the business-owner app on mobile. On desktop the sidebar
 * (OwnerLayout) takes over, so this is hidden at `lg`. Plan & billing lives on
 * the dashboard/profile on mobile; it's on the sidebar for desktop.
 */
export function OwnerNav() {
  const { data: config } = useAppConfig()
  const items = visibleOwnerNav(OWNER_MOBILE_NAV, config?.ownerModules).map(
    ({ to, shortLabel, icon }) => ({ to, label: shortLabel, icon }),
  )

  return <TabBar items={items} label="Business navigation" id="owner-tab" />
}
