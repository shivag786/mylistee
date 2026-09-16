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

function renderButton(status: AuthStatus, signInWithGoogle = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    signInWithGoogle,
    ...render(
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
          <FollowButton slug="chai-point" name="Chai Point" isFollowing={false} followersCount={4} />
        </AuthContext.Provider>
      </QueryClientProvider>,
    ),
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
