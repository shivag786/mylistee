import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppBar } from '@/components/navigation/AppBar'
import { BottomNav } from '@/components/navigation/BottomNav'
import { PageTransition } from '@/components/motion/PageTransition'
import { SuspenseOutlet } from '@/app/PageLoader'

/**
 * Shell for the customer-facing app: fixed app bar, scrollable content with
 * page transitions, and a thumb-reachable bottom navigation (document/phase/06).
 */
export function CustomerLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppBar />
      <main id="main-content" className="app-container flex-1 py-4 pb-6">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <SuspenseOutlet>
              <Outlet />
            </SuspenseOutlet>
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
