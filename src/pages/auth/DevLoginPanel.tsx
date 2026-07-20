import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { landingPathForRole } from '@/features/auth/roleRoutes'
import type { UserRole } from '@/types/common'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'

/**
 * DEV-ONLY sign-in shortcut. Renders only under `import.meta.env.DEV` and calls
 * the backend `/auth/dev-login` route (itself disabled in production), so the
 * app can be exercised end-to-end before Firebase credentials are wired up.
 */
const DEV_ACCOUNTS: { role: UserRole; label: string; email: string; name: string }[] = [
  { role: 'customer', label: 'Customer', email: 'dev.customer@listee.test', name: 'Dev Customer' },
  {
    role: 'business_owner',
    label: 'Business Owner',
    email: 'dev.owner@listee.test',
    name: 'Dev Owner',
  },
  { role: 'admin', label: 'Admin', email: 'dev.admin@listee.test', name: 'Dev Admin' },
]

export function DevLoginPanel({ from }: { from?: string }) {
  const { devLogin } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState<UserRole | null>(null)

  async function handleDevLogin(account: (typeof DEV_ACCOUNTS)[number]) {
    setPending(account.role)
    try {
      const user = await devLogin(account.email, account.name, account.role)
      toast.success(`Signed in as ${account.label} (dev)`)
      navigate(from ?? landingPathForRole(user.role), { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Dev login failed.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-small uppercase tracking-wide text-text-muted">Dev sign-in</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DEV_ACCOUNTS.map((account) => (
          <Button
            key={account.role}
            variant="outline"
            size="sm"
            isLoading={pending === account.role}
            disabled={pending !== null}
            onClick={() => void handleDevLogin(account)}
          >
            {account.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
