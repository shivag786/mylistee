import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/app/AppProviders'
import { AppRouter } from '@/app/AppRouter'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { ConnectionStatus } from '@/components/system/ConnectionStatus'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'
import { InstallBanner } from '@/features/pwa/InstallBanner'
import { PwaController } from '@/features/pwa/PwaController'
import { PwaDisabledGate } from '@/features/pwa/PwaDisabledGate'
import { PushRegistrar } from '@/features/notifications/components/PushRegistrar'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          {/* Sits inside the providers so it can read the flag, and around the
              app so a switched-off PWA never renders one — push included. */}
          <PwaDisabledGate>
            <SkipToContent />
            <OfflineBanner />
            <AppRouter />
            <InstallBanner />
            <PushRegistrar />
          </PwaDisabledGate>
          {/* Outside the gate: it still has to unregister the worker and cache
              the flag on a device that is being shown the notice. */}
          <PwaController />
        </BrowserRouter>
        <Toaster />
        <ConnectionStatus />
      </AppProviders>
    </ErrorBoundary>
  )
}
