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
 */
import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { GoogleSignInDialog } from '@/features/auth/components/GoogleSignInDialog'
import { useToggleFavorite } from '../hooks/useFavorites'
import { publicBusinessKeys } from '../hooks/usePublicBusiness'
import { useQueryClient } from '@tanstack/react-query'
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

  // Optimistic: the count and label move on tap rather than after the round
  // trip, and fall back to the server's answer when the profile refetches.
  const [following, setFollowing] = useState(isFollowing)
  const [count, setCount] = useState(followersCount)

  async function follow(next: boolean) {
    const previous = { following, count }
    setFollowing(next)
    setCount((c) => Math.max(0, c + (next ? 1 : -1)))
    try {
      await toggle.mutateAsync({ slug, next })
      void qc.invalidateQueries({ queryKey: publicBusinessKeys.profile(slug) })
      if (next) toast.success(`Following ${name}`)
    } catch {
      setFollowing(previous.following)
      setCount(previous.count)
      toast.error('Could not update. Please try again.')
    }
  }

  function handleClick() {
    if (!isAuthenticated) {
      setAskSignIn(true)
      return
    }
    void follow(!following)
  }

  return (
    <>
      <Button
        variant={following ? 'secondary' : 'primary'}
        size="sm"
        onClick={handleClick}
        isLoading={toggle.isPending}
        leftIcon={following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      >
        {following ? 'Following' : 'Follow'}
        {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
      </Button>

      <GoogleSignInDialog
        open={askSignIn}
        onOpenChange={setAskSignIn}
        reason={`Sign in to follow ${name} and get their latest offers.`}
        // Signing in succeeded, so do the thing they tapped Follow for.
        onSignedIn={() => follow(true)}
      />
    </>
  )
}
