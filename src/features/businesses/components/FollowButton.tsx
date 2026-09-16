/**
 * Follow / Following on a shop profile.
 *
 * A follow is the same saved-shop row as a favourite, read from the shop's
 * side — so following here also fills the customer's Favourites, and the owner
 * sees the follower in their own list.
 *
 * Signed out, the button does not send anyone to the login page. It opens the
 * Google dialog in place and, once that succeeds, performs the follow the
 * visitor originally asked for — one tap, same page, nothing lost.
 *
 * The server is the single source of truth here. An earlier version copied the
 * props into `useState`, which meant the button kept whatever it was told on
 * first render: after signing in, the follow really was saved, but the button
 * still read "Follow", so the next tap sent an unfollow. `pending` is only an
 * optimistic override for the moment between the tap and the refetch, and it is
 * dropped as soon as the profile comes back.
 */
import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { GoogleSignInDialog } from '@/features/auth/components/GoogleSignInDialog'
import { useToggleFavorite } from '../hooks/useFavorites'
import { publicBusinessKeys } from '../hooks/usePublicBusiness'
import { toast } from '@/utils/toast'

interface FollowButtonProps {
  slug: string
  name: string
  isFollowing: boolean
  followersCount: number
}

export function FollowButton({ slug, name, isFollowing, followersCount }: FollowButtonProps) {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const toggle = useToggleFavorite()
  const [askSignIn, setAskSignIn] = useState(false)

  /** What we are optimistically showing, or null when the server's answer stands. */
  const [pending, setPending] = useState<boolean | null>(null)

  const following = pending ?? isFollowing
  // Nudge the count only while the server has not caught up with the tap;
  // once `isFollowing` agrees with `pending`, the real count is already right.
  const count =
    followersCount + (pending === null || pending === isFollowing ? 0 : pending ? 1 : -1)

  async function setFollow(next: boolean) {
    setPending(next)
    try {
      await toggle.mutateAsync({ slug, next })
      // Wait for the profile to come back before dropping the override, so the
      // button never flickers through a stale value on its way to the truth.
      await qc.invalidateQueries({ queryKey: publicBusinessKeys.profile(slug) })
      if (next) toast.success(`Following ${name}`)
    } catch {
      toast.error('Could not update. Please try again.')
    } finally {
      setPending(null)
    }
  }

  function handleClick() {
    if (!isAuthenticated) {
      setAskSignIn(true)
      return
    }
    void setFollow(!following)
  }

  return (
    <>
      <Button
        // Following is a done state, not a call to action — outline keeps it
        // quiet next to the page's real CTAs instead of a second filled block.
        variant={following ? 'outline' : 'primary'}
        size="sm"
        onClick={handleClick}
        isLoading={toggle.isPending}
        leftIcon={following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      >
        {following ? 'Following' : 'Follow'}
        {count > 0 && <span className="ml-1.5 font-normal opacity-70">{count}</span>}
      </Button>

      <GoogleSignInDialog
        open={askSignIn}
        onOpenChange={setAskSignIn}
        reason={`Sign in to follow ${name} and get their latest offers.`}
        // Signing in succeeded, so do the thing they tapped Follow for.
        onSignedIn={() => setFollow(true)}
      />
    </>
  )
}
