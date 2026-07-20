import { Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/feedback/Spinner'

/** Fallback shown while a lazy route chunk loads (Milestone 15). */
export function PageLoader() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Spinner size={32} label="Loading" />
    </div>
  )
}

/** Wrap lazy route content in a Suspense boundary that keeps the shell mounted. */
export function SuspenseOutlet({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}
