import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { apiClient } from '@/services/apiClient'
import { useAppConfig } from '@/hooks/useAppConfig'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { weakPinReason } from '@/features/auth/strongPin'

interface ForgotPinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMobile?: string
  /** Called with the number and new PIN, so the form can sign straight in. */
  onReset?: (mobile: string, pin: string) => void
}

/**
 * Forgot PIN: a 6-digit code on WhatsApp, then a new PIN. Offered only while
 * the admin has a WhatsApp login-code template set (GET /config → auth.whatsappOtp).
 */
export function ForgotPinDialog({ open, onOpenChange, initialMobile = '', onReset }: ForgotPinDialogProps) {
  const [step, setStep] = useState<'mobile' | 'code'>('mobile')
  const [mobile, setMobile] = useState(initialMobile)
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep('mobile')
      setMobile(initialMobile)
      setCode('')
      setPin('')
      setError(null)
    }
  }, [open, initialMobile])

  async function sendCode() {
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, '').slice(-10))) return setError('Enter your 10-digit mobile number.')
    setLoading(true)
    setError(null)
    try {
      await apiClient.post('auth/pin/forgot', { mobile })
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function reset() {
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from WhatsApp.')
    if (!/^\d{4,8}$/.test(pin)) return setError('Your new PIN is 4 to 8 digits.')
    const weak = weakPinReason(pin)
    if (weak) return setError(weak)
    setLoading(true)
    setError(null)
    try {
      await apiClient.post('auth/pin/reset', { mobile, code, pin })
      toast.success('PIN changed', 'Signing you in with the new PIN.')
      onOpenChange(false)
      onReset?.(mobile, pin)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the PIN. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-[#25D366]" aria-hidden /> Forgot PIN
          </DialogTitle>
          <DialogDescription>
            {step === 'mobile'
              ? 'We send a 6-digit code to your number on WhatsApp.'
              : `If ${mobile} has a Listee account, the code is on WhatsApp now. It works for 10 minutes.`}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void (step === 'mobile' ? sendCode() : reset())
          }}
        >
          {step === 'mobile' ? (
            <div className="space-y-1.5">
              <Label htmlFor="fp-mobile">Mobile number</Label>
              <Input id="fp-mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fp-code">Code from WhatsApp</Label>
                <Input
                  id="fp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digits"
                  className="text-center font-mono text-body-lg tracking-[0.4em]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fp-pin">New PIN</Label>
                <PasswordInput id="fp-pin" inputMode="numeric" autoComplete="new-password" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 to 8 digits" />
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="text-center text-caption text-danger">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            {step === 'mobile' ? 'Send code on WhatsApp' : 'Set new PIN'}
          </Button>
          {step === 'code' && (
            <button type="button" onClick={() => void sendCode()} disabled={loading} className="w-full text-center text-small font-semibold text-primary hover:underline">
              Send the code again
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** A "Forgot PIN?" link that opens the dialog — renders nothing while WhatsApp codes are off. */
export function ForgotPinLink({ mobile, onReset }: { mobile?: string; onReset?: (mobile: string, pin: string) => void }) {
  const { data: config } = useAppConfig()
  const [open, setOpen] = useState(false)
  if (!config?.auth?.whatsappOtp) return null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-small font-semibold text-primary hover:underline">
        Forgot PIN?
      </button>
      <ForgotPinDialog open={open} onOpenChange={setOpen} initialMobile={mobile} onReset={onReset} />
    </>
  )
}
