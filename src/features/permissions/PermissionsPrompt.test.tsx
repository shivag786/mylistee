/**
 * The card is what appears by default; the native dialogs must still come from
 * a tap. These cover when it shows, what it asks for, and that a denial is
 * treated as final.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PermissionsPrompt } from './PermissionsPrompt'

// The card waits for the page to paint before appearing, which is longer than
// testing-library's default one-second wait.
const APPEARS_WITHIN = 2500

const locationValue = vi.fn()
const pushValue = vi.fn()

vi.mock('@/features/location/useAppLocation', () => ({
  useAppLocation: () => locationValue(),
}))
vi.mock('@/features/notifications/hooks/usePush', () => ({
  usePushRegistration: () => pushValue(),
}))

const request = vi.fn()
const enable = vi.fn()

describe('PermissionsPrompt', () => {
  beforeEach(() => {
    localStorage.clear()
    request.mockReset()
    enable.mockReset().mockResolvedValue(undefined)
    locationValue.mockReturnValue({ status: 'idle', request, coords: null, label: null })
    pushValue.mockReturnValue({ permission: 'default', enable })
  })

  it('appears on its own when nothing has been asked yet', async () => {
    render(<PermissionsPrompt />)
    expect(await screen.findByText('Get the best of Listee', undefined, { timeout: APPEARS_WITHIN })).toBeTruthy()
  })

  it('opens both native dialogs from the tap, not on load', async () => {
    render(<PermissionsPrompt />)
    await screen.findByText('Get the best of Listee', undefined, { timeout: APPEARS_WITHIN })

    // Nothing asked while it was only sitting there.
    expect(request).not.toHaveBeenCalled()
    expect(enable).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Allow' }))

    expect(request).toHaveBeenCalled()
    await waitFor(() => expect(enable).toHaveBeenCalled())
  })

  it('stays away once dismissed', async () => {
    const { unmount } = render(<PermissionsPrompt />)
    await screen.findByText('Get the best of Listee', undefined, { timeout: APPEARS_WITHIN })
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))
    unmount()

    render(<PermissionsPrompt />)
    await new Promise((r) => setTimeout(r, APPEARS_WITHIN))
    expect(screen.queryByText('Get the best of Listee')).toBeNull()
  })

  it('does not nag when the browser has already answered both', async () => {
    // 'denied' is the browser's to change, not ours — re-asking does nothing.
    locationValue.mockReturnValue({ status: 'denied', request, coords: null, label: null })
    pushValue.mockReturnValue({ permission: 'denied', enable })

    render(<PermissionsPrompt />)
    await new Promise((r) => setTimeout(r, APPEARS_WITHIN))
    expect(screen.queryByText('Get the best of Listee')).toBeNull()
  })

  it('asks only for what is still missing', async () => {
    locationValue.mockReturnValue({ status: 'ready', request, coords: { lat: 1, lng: 2 }, label: null })

    render(<PermissionsPrompt />)
    await screen.findByText('Get the best of Listee', undefined, { timeout: APPEARS_WITHIN })

    expect(screen.queryByText(/nearest to you/i)).toBeNull()
    expect(screen.getByText(/posts a reward/i)).toBeTruthy()
  })
})
