import { lazyPage } from '@/app/lazyPage'
import { SuspenseOutlet } from '@/app/PageLoader'
import { Spinner } from '@/components/feedback/Spinner'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { useShowsLanding } from './homeEntry'

// Its own chunk: visitors who get the shop feed never download it.
const LandingPage = lazyPage(() => import('@/pages/LandingPage'), 'LandingPage')

/**
 * The `/` route: the landing page (standalone, with its own header and footer)
 * or the customer app shell, whose index child is the shop feed. See homeEntry.
 */
export function HomeGate() {
  const showsLanding = useShowsLanding()

  if (showsLanding === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Loading" />
      </div>
    )
  }

  if (showsLanding) {
    return (
      <SuspenseOutlet>
        <LandingPage />
      </SuspenseOutlet>
    )
  }

  return <CustomerLayout />
}
