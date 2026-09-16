/**
 * The point of this guard is a business owner reopening the app and landing on
 * their dashboard rather than the customer home — while still being able to
 * reach that home page deliberately, which is what the entry-only rule buys.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import type { AuthStatus, AuthUser } from '../types'
import { AppEntryRedirect } from './AppEntryRedirect'
import type { UserRole } from '@/types/common'

/** Navigates to `/` on mount, standing in for an owner tapping a home link. */
function GoHome() {
  const navigate = useNavigate()
  useEffect(() => {
    void navigate('/')
  }, [navigate])
  return <p>leaving</p>
}

function renderApp(
  entry: string,
  session: { status: AuthStatus; role?: UserRole },
) {
  const user = session.role
    ? ({ id: 1, name: 'Test', email: 't@example.com', role: session.role } as unknown as AuthUser)
    : null

  return render(
    <MemoryRouter initialEntries={[entry]}>
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
          <Route
            path="/"
            element={
              <AppEntryRedirect>
                <p>customer home</p>
              </AppEntryRedirect>
            }
          />
          <Route path="/business" element={<p>owner entry</p>} />
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/admin/dashboard" element={<p>admin panel</p>} />
          <Route path="/go-home" element={<GoHome />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AppEntryRedirect', () => {
  it('takes a business owner reopening the app to their dashboard', () => {
    renderApp('/', { status: 'authenticated', role: 'business_owner' })
    expect(screen.getByText('owner entry')).toBeTruthy()
  })

  it('takes an admin reopening the app to the admin panel', () => {
    renderApp('/', { status: 'authenticated', role: 'admin' })
    expect(screen.getByText('admin panel')).toBeTruthy()
  })

  it('leaves a customer on the home page', () => {
    renderApp('/', { status: 'authenticated', role: 'customer' })
    expect(screen.getByText('customer home')).toBeTruthy()
  })

  it('asks a visitor with no session to sign in', () => {
    renderApp('/', { status: 'unauthenticated' })
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('still lets a guest browse after choosing "Skip for now"', () => {
    // Skip navigates to `/`, which is not app entry — otherwise the guest
    // would bounce straight back to the login screen and be stuck there.
    renderApp('/go-home', { status: 'unauthenticated' })
    expect(screen.getByText('customer home')).toBeTruthy()
  })

  it('waits rather than flashing the home page while the session resolves', () => {
    renderApp('/', { status: 'initializing' })
    expect(screen.queryByText('customer home')).toBeNull()
    expect(screen.getByText('Checking your session')).toBeTruthy()
  })

  it('still lets an owner open the customer home mid-session', () => {
    // Entering elsewhere and navigating to `/` is not app entry, so the owner
    // gets the home page instead of being bounced back to the dashboard.
    renderApp('/go-home', { status: 'authenticated', role: 'business_owner' })
    expect(screen.getByText('customer home')).toBeTruthy()
  })
})
