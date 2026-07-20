import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Heart, Store, Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  business_owner: 'Business Owner',
  admin: 'Admin',
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Guarded by <RequireAuth>, so `user` is present in practice.
  if (!user) return null

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      toast.success('Signed out')
      navigate(ROUTES.login, { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Profile</h1>
      <Card className="flex items-center gap-4">
        <Avatar name={user.name} src={user.photoUrl} size="lg" />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-body-lg font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-caption text-text-secondary">{user.email}</p>
          {user.role !== 'customer' && (
            <Badge tone="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          )}
        </div>
      </Card>

      <Card padding="none">
        <ProfileRow
          icon={<Heart className="size-5" />}
          label="Favorite businesses"
          onClick={() => navigate(ROUTES.favorites)}
        />
        <ProfileRow icon={<Store className="size-5" />} label="Visit history" />
        <ProfileRow
          icon={<Bell className="size-5" />}
          label="Notifications"
          onClick={() => navigate(ROUTES.notifications)}
        />
      </Card>

      <Button
        variant="outline"
        fullWidth
        leftIcon={<LogOut className="size-5" />}
        onClick={() => setConfirmOpen(true)}
      >
        Sign out
      </Button>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out of Listee?"
        description="You'll need to sign in again to view your wallet and rewards."
        confirmLabel="Sign out"
        isLoading={signingOut}
        onConfirm={handleSignOut}
      />
    </div>
  )
}

function ProfileRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/60 px-5 py-4 text-left last:border-b-0 hover:bg-surface-muted"
    >
      <span className="text-text-secondary">{icon}</span>
      <span className="text-body text-foreground">{label}</span>
    </button>
  )
}
