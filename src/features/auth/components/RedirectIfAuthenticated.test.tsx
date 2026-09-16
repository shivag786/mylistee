/**
 * The guard decides where somebody with a session lands instead of a login
 * form, so these cover the routing outcomes rather than the rendering: an owner
 * reaches their dashboard, a visitor with no session still gets the form, and a
 * signed-in customer is never bounced away from the staff pages.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import type { AuthStatus, AuthUser } from '../types'
import { RedirectIfAuthenticated } from './RedirectIfAuthenticated'
import { rememberPostLoginTarget } from '../postLoginTarget'
import type { UserRole } from '@/types/common'

function renderAt(
  path: string,
  session: { status: AuthStatus; role?: UserRole },
  roles?: UserRole[],
  state?: unknown,
) {
  const user = session.role
    ? ({ id: 1, name: 'Test', email: 't@example.com', role: session.role } as unknown as AuthUser)
    : null

  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <AuthContext.Provider
        value={
          {
            user,
            status: session.status,
            isAuthenticated: session.status === 'authenticated',
          } as never
        }
      >
        <Routes>
          <Route element={<RedirectIfAuthenticated roles={roles} />}>
            <Route path="/login" element={<p>login form</p>} />
            <Route path="/business/login" element={<p>staff login form</p>} />
          </Route>
          <Route path="/business" element={<p>owner entry</p>} />
          <Route path="/admin/dashboard" element={<p>admin panel</p>} />
          <Route path="/" element={<p>customer home</p>} />
          <Route path="/wallet" element={<p>wallet</p>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('RedirectIfAuthenticated', () => {
  beforeEach(() => rememberPostLoginTarget(null))

  it('sends a signed-in business owner to the owner app instead of the login form', () => {
    renderAt('/business/login', { status: 'authenticated', role: 'business_owner' })
    expect(screen.getByText('owner entry')).toBeTruthy()
  })

  it('sends a signed-in admin to the admin panel', () => {
    renderAt('/business/login', { status: 'authenticated', role: 'admin' })
    expect(screen.getByText('admin panel')).toBeTruthy()
  })

  it('shows the login form when there is no session', () => {
    renderAt('/business/login', { status: 'unauthenticated' })
    expect(screen.getByText('staff login form')).toBeTruthy()
  })

  it('waits rather than flashing the form while the session is still resolving', () => {
    renderAt('/login', { status: 'initializing' })
    expect(screen.queryByText('login form')).toBeNull()
    expect(screen.getByText('Checking your session')).toBeTruthy()
  })

  it('leaves the staff pages reachable for a signed-in customer', () => {
    renderAt('/business/login', { status: 'authenticated', role: 'customer' }, [
      'business_owner',
      'admin',
    ])
    expect(screen.getByText('staff login form')).toBeTruthy()
  })

  it('honours the page the user was originally headed for', () => {
    renderAt('/login', { status: 'authenticated', role: 'customer' }, undefined, {
      from: { pathname: '/wallet' },
    })
    expect(screen.getByText('wallet')).toBeTruthy()
  })

  it('restores a destination that a full-page Google redirect would have lost', () => {
    rememberPostLoginTarget('/wallet')
    renderAt('/login', { status: 'authenticated', role: 'customer' })
    expect(screen.getByText('wallet')).toBeTruthy()
  })
})
