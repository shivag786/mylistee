import { Navigate } from 'react-router-dom'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ROUTES } from '@/constants/routes'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'

/**
 * Entry point for `/business`: routes an owner to registration (no business yet)
 * or straight to their dashboard.
 */
export function OwnerEntry() {
  const { data: business, isLoading, isError, refetch } = useOwnerBusiness()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Loading" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <ErrorState variant="serverError" onRetry={() => void refetch()} />
      </div>
    )
  }

  return <Navigate to={business ? ROUTES.owner.dashboard : ROUTES.owner.register} replace />
}
