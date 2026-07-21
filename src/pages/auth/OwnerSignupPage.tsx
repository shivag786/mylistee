import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { fadeInUp } from '@/animations'

/**
 * Public business-owner sign-up (mobile + PIN). Creates the owner account, signs
 * them in, and sends them straight to the business registration wizard — so the
 * "Register your business" link no longer bounces logged-out visitors to login.
 */
export function OwnerSignupPage() {
  const { registerOwner } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) return setError('Please enter your name.')
    if (!/^\d{10}$/.test(mobile.trim())) return setError('Enter a valid 10-digit mobile number.')
    if (!/^\d{4,8}$/.test(pin)) return setError('Your PIN must be 4–8 digits.')
    if (pin !== confirmPin) return setError('The PINs do not match.')

    setLoading(true)
    try {
      await registerOwner(name.trim(), mobile.trim(), pin)
      toast.success('Account created! Let’s set up your business.')
      navigate(ROUTES.owner.register, { replace: true })
    } catch (err) {
      // Prefer the field-specific message (e.g. "…mobile number already
      // exists…") over the generic "The given data was invalid."
      const msg =
        err instanceof ApiError
          ? ((err.errors && Object.values(err.errors)[0]?.[0]) ?? err.message)
          : 'Could not create your account.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-10">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Store className="size-7" aria-hidden />
        </span>
        <h1 className="text-title font-bold text-foreground">Register your business</h1>
        <p className="max-w-xs text-body text-text-secondary">
          Create an owner account with your mobile number and a PIN. You’ll set up your business next.
        </p>
      </motion.div>

      <motion.form
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
        onSubmit={submit}
        className="w-full max-w-sm space-y-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="su-name">Your name</Label>
          <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Shah" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-mobile">Mobile number</Label>
          <Input id="su-mobile" inputMode="numeric" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" maxLength={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="su-pin">Create PIN</Label>
            <PasswordInput id="su-pin" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4–8 digits" maxLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-pin2">Confirm PIN</Label>
            <PasswordInput id="su-pin2" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="Repeat PIN" maxLength={8} />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-center text-caption text-danger">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth isLoading={loading}>
          Create account &amp; continue
        </Button>

        <Link
          to={ROUTES.login}
          className="flex items-center justify-center gap-1.5 pt-1 text-caption text-text-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Already have an account? Sign in
        </Link>
      </motion.form>

      <span className="opacity-60">
        <Logo size={28} />
      </span>
    </div>
  )
}
