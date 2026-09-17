/**
 * The behaviour worth pinning down is the signed-out path: tapping must ask for
 * Google in place and then save the shop, never navigate away.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/features/auth/context/AuthContext'
import type { AuthStatus } from '@/features/auth/types'
import { FavoriteButton } from './FavoriteButton'

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
  initial: { isFavorite?: boolean } = { isFavorite: false },
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  function Harness({ isFavorite }: { isFavorite?: boolean }) {
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
          <FavoriteButton slug="chai-point" name="Chai Point" isFavorite={isFavorite} />
        </AuthContext.Provider>
      </QueryClientProvider>
    )
  }

  const view = render(<Harness isFavorite={initial.isFavorite} />)
  return {
    signInWithGoogle,
    /** Stand in for the profile refetch landing with the server's new answer. */
    serverSays: (isFavorite: boolean) => view.rerender(<Harness isFavorite={isFavorite} />),
    ...view,
  }
}

describe('FavoriteButton', () => {
  beforeEach(() => {
    addFavorite.mockReset().mockResolvedValue(undefined)
    removeFavorite.mockReset().mockResolvedValue(undefined)
  })

  it('offers to add the shop, with no count anywhere', () => {
    renderButton('unauthenticated')
    expect(screen.getByRole('button', { name: /Add Chai Point to favourites/i })).toBeTruthy()
    expect(screen.getByText('Add to favorites')).toBeTruthy()
  })

  it('saves straight away when already signed in', async () => {
    renderButton('authenticated')
    await userEvent.click(screen.getByRole('button', { name: /Add Chai Point to favourites/i }))
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
  })

  it('asks for Google in place instead of navigating when signed out', async () => {
    renderButton('unauthenticated')
    await userEvent.click(screen.getByRole('button', { name: /Add Chai Point to favourites/i }))

    expect(await screen.findByText('Sign in to Listee')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeTruthy()
    // Nothing was saved yet, and nothing navigated.
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('takes the refetched profile as the truth, not its first render', async () => {
    // The reported bug. Signing in clears the query cache, so the profile
    // refetches and this button is torn down and rebuilt. It used to copy its
    // props into useState on that first render, so when the refetch landed
    // saying the follow HAD been saved, the button still read "Follow" — and
    // the next tap sent an unfollow.
    const { serverSays } = renderButton('authenticated')
    expect(screen.getByRole('button', { name: /Add Chai Point to favourites/i })).toBeTruthy()

    serverSays(true)

    expect(
      await screen.findByRole('button', { name: /Remove Chai Point from favourites/i }),
    ).toBeTruthy()
    expect(screen.getByText('Favourite')).toBeTruthy()
  })

  it('keeps working against an API that does not report saved state', async () => {
    // Such an API omits the field entirely. Deferring to an answer that never
    // comes would reset the button after every tap, so the save works and the
    // UI insists it did not.
    renderButton('authenticated', vi.fn(), {})

    await userEvent.click(screen.getByRole('button', { name: /Add Chai Point to favourites/i }))

    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
    expect(
      await screen.findByRole('button', { name: /Remove Chai Point from favourites/i }),
    ).toBeTruthy()
  })

  it('saves the shop the visitor asked for once sign-in succeeds', async () => {
    const signIn = vi.fn().mockResolvedValue({ id: 1, role: 'customer' })
    renderButton('unauthenticated', signIn)

    await userEvent.click(screen.getByRole('button', { name: /Add Chai Point to favourites/i }))
    await userEvent.click(await screen.findByRole('button', { name: /Continue with Google/i }))

    await waitFor(() => expect(signIn).toHaveBeenCalled())
    // The whole point: they tapped to add it, so the shop ends up saved.
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('chai-point'))
  })
})
