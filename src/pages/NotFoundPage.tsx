import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <EmptyState
        icon={<Compass className="size-7" />}
        title={MESSAGES.errors.notFound}
        description="Let's get you back on track."
        actionLabel="Go home"
        onAction={() => navigate(ROUTES.home)}
      />
    </div>
  )
}
