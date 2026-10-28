/**
 * The PIN is the only thing between a known mobile number and someone's
 * account, so the form must check it before sending, never send a mismatched
 * pair on sign-up, and route each mode to its own endpoint.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { CustomerMobileAuth } from './CustomerMobileAuth'

const pinLogin = vi.fn()
const registerCustomer = vi.fn()
const onSignedIn = vi.fn()

// "Forgot PIN?" shows only while the admin has WhatsApp login codes on.
let appConfig: { auth?: { google: boolean; mobile: boolean; whatsappOtp?: boolean } } | undefined
vi.mock('@/hooks/useAppConfig', () => ({ useAppConfig: () => ({ data: appConfig }) }))

function renderForm() {
  return render(
    <AuthContext.Provider value={{ pinLogin, registerCustomer } as never}>
      <CustomerMobileAuth onSignedIn={onSignedIn} />
    </AuthContext.Provider>,
  )
}

describe('CustomerMobileAuth', () => {
  beforeEach(() => {
    pinLogin.mockReset().mockResolvedValue({ id: 1, role: 'customer' })
    registerCustomer.mockReset().mockResolvedValue({ id: 2, role: 'customer' })
    onSignedIn.mockReset()
    // The last number used is remembered; each test starts on a new device.
    localStorage.clear()
    appConfig = undefined
  })

  it('offers "Forgot PIN?" only while WhatsApp codes are on', () => {
    const first = renderForm()
    expect(screen.queryByRole('button', { name: 'Forgot PIN?' })).toBeNull()
    first.unmount()

    appConfig = { auth: { google: true, mobile: true, whatsappOtp: true } }
    renderForm()
    expect(screen.getByRole('button', { name: 'Forgot PIN?' })).toBeTruthy()
  })

  it('signs an existing customer in with mobile and PIN', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('PIN'), '4321')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(pinLogin).toHaveBeenCalledWith('9876543210', '4321'))
    expect(onSignedIn).toHaveBeenCalled()
  })

  it('fills in the number used last time on this device', async () => {
    const first = renderForm()
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('PIN'), '4321')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(onSignedIn).toHaveBeenCalled())
    first.unmount()

    renderForm()
    expect((screen.getByLabelText('Mobile number') as HTMLInputElement).value).toBe('9876543210')
  })

  it('refuses a mobile number that is not ten digits', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Mobile number'), '98765')
    await userEvent.type(screen.getByLabelText('PIN'), '4321')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(pinLogin).not.toHaveBeenCalled()
  })

  it('keeps letters out of the number and the PIN', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Mobile number'), '98a76b54c32d10')
    expect((screen.getByLabelText('Mobile number') as HTMLInputElement).value).toBe('9876543210')
  })

  it('never creates an account from two PINs that do not match', async () => {
    // A typo here would lock them out of an account they just made.
    renderForm()
    await userEvent.click(screen.getByRole('tab', { name: 'New here?' }))
    await userEvent.type(screen.getByLabelText('Your name'), 'Asha')
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Choose a PIN'), '4816')
    await userEvent.type(screen.getByLabelText('Confirm PIN'), '4817')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('The two PINs do not match.')).toBeTruthy()
    expect(registerCustomer).not.toHaveBeenCalled()
  })

  it('refuses an easy PIN when choosing one', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('tab', { name: 'New here?' }))
    await userEvent.type(screen.getByLabelText('Your name'), 'Asha')
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Choose a PIN'), '1234')
    await userEvent.type(screen.getByLabelText('Confirm PIN'), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText(/too easy to guess/)).toBeTruthy()
    expect(registerCustomer).not.toHaveBeenCalled()
  })

  it('still signs in with an easy PIN chosen before the rule existed', async () => {
    // The rule is for choosing a PIN. Refusing to sign in with an old one would
    // lock out the very people it is meant to protect.
    renderForm()
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('PIN'), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(pinLogin).toHaveBeenCalledWith('9876543210', '1234'))
  })

  it('creates an account and signs the new customer in', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('tab', { name: 'New here?' }))
    await userEvent.type(screen.getByLabelText('Your name'), 'Asha')
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Choose a PIN'), '4816')
    await userEvent.type(screen.getByLabelText('Confirm PIN'), '4816')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(registerCustomer).toHaveBeenCalledWith('Asha', '9876543210', '4816'))
    expect(onSignedIn).toHaveBeenCalled()
    expect(pinLogin).not.toHaveBeenCalled()
  })
})
