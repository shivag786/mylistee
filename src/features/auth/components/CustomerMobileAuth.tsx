/**
 * Customer sign-in and sign-up with mobile + PIN, shown when an admin has turned
 * mobile login on.
 *
 * No OTP by design. The PIN is what keeps someone who merely knows a number out
 * of that account -- its coins, wallet and orders -- so it is asked for both
 * ways, and chosen twice on sign-up so a typo does not lock the customer out of
 * an account they just made.
 */
import { useState, type FormEvent } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import type { AuthUser } from '../types'
import { weakPinReason } from '../strongPin'

type Mode = 'signin' | 'signup'

const MOBILE = /^\d{10}$/
const PIN = /^\d{4,8}$/

export function CustomerMobileAuth({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const { pinLogin, registerCustomer } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPin('')
    setConfirmPin('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const phone = mobile.trim()
    if (!MOBILE.test(phone)) return setError('Enter your 10-digit mobile number.')
    if (!PIN.test(pin)) return setError('Your PIN is 4 to 8 digits.')
    if (mode === 'signup') {
      if (name.trim().length < 2) return setError('Please enter your name.')
      // Only when choosing one: an existing PIN must still work to sign in.
      const weak = weakPinReason(pin)
      if (weak) return setError(weak)
      if (pin !== confirmPin) return setError('The two PINs do not match.')
    }

    setLoading(true)
    try {
      const user =
        mode === 'signin'
          ? await pinLogin(phone, pin)
          : await registerCustomer(name.trim(), phone, pin)
      onSignedIn(user)
    } catch (err) {
      // Prefer the field message ("…already exists…") over the generic one.
      const message =
        err instanceof ApiError
          ? ((err.errors && Object.values(err.errors)[0]?.[0]) ?? err.message)
          : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1" role="tablist">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              'rounded-lg py-1.5 text-caption font-medium transition-colors',
              mode === m ? 'bg-surface text-foreground shadow-soft' : 'text-text-secondary',
            )}
          >
            {m === 'signin' ? 'Sign in' : 'New here?'}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Your name</Label>
          <Input id="c-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="c-mobile">Mobile number</Label>
        <Input
          id="c-mobile"
          inputMode="tel"
          autoComplete="tel"
          maxLength={10}
          placeholder="10-digit mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-pin">{mode === 'signup' ? 'Choose a PIN' : 'PIN'}</Label>
        <PasswordInput
          id="c-pin"
          inputMode="numeric"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          maxLength={8}
          placeholder="4 to 8 digits"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      {mode === 'signup' && (
        <div className="space-y-1.5">
          <Label htmlFor="c-pin2">Confirm PIN</Label>
          <PasswordInput
            id="c-pin2"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={8}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-center text-caption text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        fullWidth
        isLoading={loading}
        leftIcon={mode === 'signin' ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
      >
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  )
}
