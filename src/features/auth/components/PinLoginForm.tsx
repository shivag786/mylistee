import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { landingPathForRole } from '@/features/auth/roleRoutes'
import { MESSAGES } from '@/constants/messages'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'

interface LocationState {
  from?: { pathname: string }
}

interface PinLoginFormProps {
  submitLabel: string
  submitIcon?: ReactNode
  initialMobile?: string
  initialPin?: string
}

/**
 * Mobile + PIN sign-in, shared by the owner and admin login pages. On success
 * it routes to the intended page (if any) or the role's landing screen.
 */
export function PinLoginForm({
  submitLabel,
  submitIcon,
  initialMobile = '',
  initialPin = '',
}: PinLoginFormProps) {
  const { pinLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname

  const [mobile, setMobile] = useState(initialMobile)
  const [pin, setPin] = useState(initialPin)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const id = mobile.trim()
    const secret = pin.trim()
    if (!id || !secret) {
      setError('Enter your mobile number and PIN.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const user = await pinLogin(id, secret)
      toast.success(MESSAGES.success.signedIn)
      navigate(from ?? landingPathForRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Check your mobile and PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input
          id="mobile"
          inputMode="tel"
          autoComplete="username"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Your registered mobile"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pin">PIN</Label>
        <PasswordInput
          id="pin"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Your PIN"
          maxLength={8}
        />
      </div>

      {error && (
        <p role="alert" className="text-center text-caption text-danger">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth isLoading={loading} leftIcon={submitIcon}>
        {submitLabel}
      </Button>
    </form>
  )
}
