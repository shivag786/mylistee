/**
 * The behaviour worth pinning down is the signed-out path: tapping Follow must
 * ask for Google in place and then complete the follow, never navigate away.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/features/auth/context/AuthContext'
import type { AuthStatus } from '@/features/auth/types'
import { FollowButton } from './FollowButton'

const addFavorite = vi.fn()
const removeFavorite = vi.fn()

vi.mock('../services/favoriteService', () => ({
  favoriteService: {
    add: (...args: unknown[]) => addFavorite(...args),
    remove: (...args: unknown[]) => removeFavorite(...args),
    list: () => Promise.resolve([]),
  },
}))

function renderButton(
  status: AuthStatus,
  signInWithGoogle = vi.fn(),
  initial: { isFollowing?: boolean; followersCount?: number } = {
    isFollowing: false,
    followersCount: 4,
  },
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  function Harness({
    isFollowing,
    followersCount,
  }: {
    isFollowing?: boolean
    followersCount?: number
  }) {
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider
          value={
            {
              user: status === 'authenticated' ? { id: 1, role: 'customer' } : null,
              status,
              isAuthenticated: status === 'authenticated',
              signInWithGoogle,
            } as never
          }
        >
          <FollowButton
            slug="chai-point"
            name="Chai Point"
            isFollowing={isFollowing}
            followersCount={followersCount}
          />
        </AuthContext.Provider>
      </QueryClientProvider>
    )
  }

  const view = render(
    <Harness isFollowing={initial.isFollowing} followersCount={initial.followersCount} />,
  )
  return {
    signInWithGoogle,
    /** Stand in for the profile refetch landing with the server's new answer. */
    serverSays: (isFollowing: boolean, followersCount: number) =>
      view.rerender(<Harness isFollowing={isFollowing} followersCount={followersCount} />),
    ...view,
  }
}

describe('FollowButton', () => {
  beforeEach(() => {
    addFavorite.mockReset().mockResolvedValue(undefined)
    removeFavorite.mockReset().mockResolvedValue(undefined)
  })

  it('shows the follower count alongside the action', () => {
    renderButton('unauthenticated')
    expect(screen.getByRole('button', { name: /Follow Chai Point/i })).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('follows straight away when already signed in', async () => {
    renderButton('authenticated')
    await userEvent.click(screen.getByRole('button', { name: /Follow Chai Point/i }))
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
  })

  it('asks for Google in place instead of navigating when signed out', async () => {
    renderButton('unauthenticated')
    await userEvent.click(screen.getByRole('button', { name: /Follow Chai Point/i }))

    expect(await screen.findByText('Sign in to Listee')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeTruthy()
    // Nothing was followed yet, and nothing navigated.
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('takes the refetched profile as the truth, not its first render', async () => {
    // The reported bug. Signing in clears the query cache, so the profile
    // refetches and this button is torn down and rebuilt. It used to copy its
    // props into useState on that first render, so when the refetch landed
    // saying the follow HAD been saved, the button still read "Follow" — and
    // the next tap sent an unfollow.
    const { serverSays } = renderButton('authenticated')
    expect(screen.getByRole('button', { name: /Follow Chai Point/i })).toBeTruthy()

    serverSays(true, 5)

    expect(await screen.findByRole('button', { name: /Unfollow Chai Point/i })).toBeTruthy()
    expect(screen.getByText('Following')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('keeps working against an API that does not report follow state', async () => {
    // An API without follow support omits `isFollowing` entirely. Deferring to
    // an answer that never comes would snap the button back to "Follow" after
    // every tap, so the follow saves and the UI insists it did not.
    renderButton('authenticated', vi.fn(), {})

    await userEvent.click(screen.getByRole('button', { name: /Follow Chai Point/i }))

    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
    expect(await screen.findByRole('button', { name: /Unfollow Chai Point/i })).toBeTruthy()
  })

  it('completes the follow the visitor asked for once sign-in succeeds', async () => {
    const signIn = vi.fn().mockResolvedValue({ id: 1, role: 'customer' })
    renderButton('unauthenticated', signIn)

    await userEvent.click(screen.getByRole('button', { name: /Follow Chai Point/i }))
    await userEvent.click(await screen.findByRole('button', { name: /Continue with Google/i }))

    await waitFor(() => expect(signIn).toHaveBeenCalled())
    // The whole point: they tapped Follow, so they end up following.
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
  })
})
