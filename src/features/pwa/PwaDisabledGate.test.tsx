/**
 * The flag governs the app, not the business: a switched-off PWA must refuse to
 * run and say so, while the same site in a browser tab carries on.
 */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PwaDisabledGate } from './PwaDisabledGate'

const pwaEnabled = vi.fn<() => boolean | undefined>()
const standalone = vi.fn<() => boolean>()

vi.mock('./usePwaEnabled', () => ({ usePwaEnabled: () => pwaEnabled() }))
vi.mock('./standalone', () => ({ isStandalone: () => standalone() }))

function renderGate() {
  return render(
    <PwaDisabledGate>
      <p>the app</p>
    </PwaDisabledGate>,
  )
}

describe('PwaDisabledGate', () => {
  beforeEach(() => {
    localStorage.clear()
    pwaEnabled.mockReturnValue(true)
    standalone.mockReturnValue(false)
  })

  it('refuses to run the installed app once the flag is off', () => {
    pwaEnabled.mockReturnValue(false)
    standalone.mockReturnValue(true)
    renderGate()

    expect(screen.getByText('App service disabled')).toBeTruthy()
    expect(screen.queryByText('the app')).toBeNull()
  })

  it('leaves the site alone in a browser tab', () => {
    // Disabling the PWA is not closing the business.
    pwaEnabled.mockReturnValue(false)
    standalone.mockReturnValue(false)
    renderGate()

    expect(screen.getByText('the app')).toBeTruthy()
  })

  it('runs the installed app while the flag is on', () => {
    standalone.mockReturnValue(true)
    renderGate()

    expect(screen.getByText('the app')).toBeTruthy()
  })

  it('uses the cached answer before the live one arrives', () => {
    // Otherwise a disabled app gets a working half second before the notice.
    localStorage.setItem('listee:pwa:enabled', '0')
    pwaEnabled.mockReturnValue(undefined)
    standalone.mockReturnValue(true)
    renderGate()

    expect(screen.getByText('App service disabled')).toBeTruthy()
  })

  it('does not flash the notice when nothing is known yet', () => {
    pwaEnabled.mockReturnValue(undefined)
    standalone.mockReturnValue(true)
    renderGate()

    expect(screen.getByText('the app')).toBeTruthy()
  })
})
