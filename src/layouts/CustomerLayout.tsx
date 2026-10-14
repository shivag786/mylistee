import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { AnimatePresence } from 'framer-motion'
import { AppBar } from '@/components/navigation/AppBar'
import { BottomNav } from '@/components/navigation/BottomNav'
import { PageTransition } from '@/components/motion/PageTransition'
import { SuspenseOutlet } from '@/app/PageLoader'
import { GlobalCartBar } from '@/features/orders/GlobalCartBar'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { LocationProvider } from '@/features/location/LocationProvider'
import { isAllowedInStore, useStoreScope } from '@/features/store/storeScope'
import { StoreAppBar, StoreBottomNav } from '@/features/store/StoreChrome'

/**
 * Shell for the customer-facing app: fixed app bar, scrollable content with
 * page transitions, and a thumb-reachable bottom navigation (document/phase/06).
 */
export function CustomerLayout() {
  const location = useLocation()
  // Premium store mode: only this shop, its orders and the account are reachable.
  const store = useStoreScope()

  if (store && !isAllowedInStore(location.pathname, store.slug)) {
    return <Navigate to={ROUTES.businessProfile(store.slug)} replace />
  }

  // Wraps the whole customer shell so the header chip and every shop list read
  // the same fix — two useUserLocation instances would prompt separately.
  return (
    <LocationProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        {store ? <StoreAppBar scope={store} /> : <AppBar />}
        <main id="main-content" className="app-container flex-1 py-4 pb-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <SuspenseOutlet>
                <Outlet />
              </SuspenseOutlet>
            </PageTransition>
          </AnimatePresence>
        </main>
        <LegalFooter />
        <GlobalCartBar />
        {store ? <StoreBottomNav scope={store} /> : <BottomNav />}
      </div>
    </LocationProvider>
  )
}
