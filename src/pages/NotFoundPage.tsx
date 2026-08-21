import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { LegalFooter } from '@/components/navigation/LegalFooter'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<Compass className="size-7" />}
          title={MESSAGES.errors.notFound}
          description="Let's get you back on track."
          actionLabel="Go home"
          onAction={() => navigate(ROUTES.home)}
        />
      </div>
      <LegalFooter />
    </div>
  )
}
