import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/app/AppProviders'
import { AppRouter } from '@/app/AppRouter'
import { ConnectionStatus } from '@/components/system/ConnectionStatus'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'
import { InstallBanner } from '@/features/pwa/InstallBanner'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <SkipToContent />
        <OfflineBanner />
        <AppRouter />
        <InstallBanner />
      </BrowserRouter>
      <Toaster />
      <ConnectionStatus />
    </AppProviders>
  )
}
