/**
 * Add to favourites on a shop profile, sitting in the header where the
 * Open/Closed badge used to be.
 *
 * Saving a shop is the same row the owner reads as a follower, so this also
 * fills the customer's Favourites list.
 *
 * Signed out, the button does not send anyone to the login page. It opens the
 * Google dialog in place and, once that succeeds, saves the shop they tapped
 * for — one tap, same page, nothing lost.
 *
 * The server is the single source of truth. An earlier version copied the props
 * into `useState`, which meant the button kept whatever it was told on first
 * render: after signing in, the shop really was saved, but the button still
 * offered to add it, so the next tap removed it. `pending` is only an
 * optimistic override, dropped the moment the server agrees with it.
 *
 * `isFavorite` is optional because an API without this field simply omits it.
 * Deferring to a server that never answers would reset the button after every
 * tap — the save works, and the UI insists it did not. When the field is
 * missing the optimistic value stays put instead.
 */
import { useEffect, useState } from 'react'
import { Check, Heart } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { GoogleSignInDialog } from '@/features/auth/components/GoogleSignInDialog'
import { useToggleFavorite } from '../hooks/useFavorites'
import { publicBusinessKeys } from '../hooks/usePublicBusiness'
import { toast } from '@/utils/toast'

interface FavoriteButtonProps {
  slug: string
  name: string
  /** Omitted by an API that does not report saved state. */
  isFavorite?: boolean
}

export function FavoriteButton({ slug, name, isFavorite }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const toggle = useToggleFavorite()
  const [askSignIn, setAskSignIn] = useState(false)

  /** What we are optimistically showing, or null when the server's answer stands. */
  const [pending, setPending] = useState<boolean | null>(null)
  const favorite = pending ?? isFavorite ?? false

  // Hand back to the server the moment it agrees — which is also what keeps the
  // override in place when the field never arrives at all.
  useEffect(() => {
    if (pending !== null && isFavorite === pending) setPending(null)
  }, [isFavorite, pending])

  async function save(next: boolean) {
    setPending(next)
    try {
      await toggle.mutateAsync({ slug, next })
      await qc.invalidateQueries({ queryKey: publicBusinessKeys.profile(slug) })
      if (next) toast.success(`Added ${name} to favourites`)
    } catch {
      setPending(null) // Roll back to whatever the server last said.
      toast.error('Could not update. Please try again.')
    }
  }

  function handleClick() {
    if (!isAuthenticated) {
      setAskSignIn(true)
      return
    }
    void save(!favorite)
  }

  return (
    <>
      <Button
        // Saved is a done state, not an offer: it drops the button chrome and
        // becomes a plain black mark, so the call to action is the only thing
        // in the header still asking to be pressed.
        variant="ghost"
        size="sm"
        onClick={handleClick}
        isLoading={toggle.isPending}
        aria-pressed={favorite}
        aria-label={favorite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
        className={
          favorite
            ? 'shrink-0 gap-1.5 bg-transparent px-1 font-bold text-foreground hover:bg-transparent'
            : 'shrink-0 gap-1.5 border border-primary bg-surface font-semibold text-primary hover:bg-primary-soft'
        }
      >
        {favorite ? (
          <>
            <Check className="size-4" strokeWidth={3} aria-hidden />
            Favourite
          </>
        ) : (
          <>
            <Heart className="size-4" aria-hidden />
            Add to favorites
          </>
        )}
      </Button>

      <GoogleSignInDialog
        open={askSignIn}
        onOpenChange={setAskSignIn}
        reason={`Sign in to save ${name} to your favourites.`}
        // Signing in succeeded, so do the thing they tapped for.
        onSignedIn={() => save(true)}
      />
    </>
  )
}
