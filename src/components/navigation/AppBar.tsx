import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/icons/Logo'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { CoinsPill } from '@/features/wallet/components/CoinsPill'

/** Top app bar: logo left, actions right, height 64 (document-00A §18). */
export function AppBar() {
  const { user } = useAuth()
  const { data: unread = 0 } = useUnreadCount()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="app-container flex h-16 items-center justify-between">
        <Link to={ROUTES.home} aria-label="Listee home">
          <Logo size={32} showWordmark />
        </Link>
        <div className="flex items-center gap-2">
          <CoinsPill />
          <IconButton
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            asChild
            className="relative"
          >
            <Link to={ROUTES.notifications}>
              <Bell aria-hidden />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </IconButton>
          <Link to={ROUTES.profile} aria-label="Your profile">
            {user ? (
              <Avatar name={user.name} src={user.photoUrl} size="md" />
            ) : (
              <Avatar name="Guest" size="md" />
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
