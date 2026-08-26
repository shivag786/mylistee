import { useState, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { authService } from '@/features/auth/services/authService'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { toast } from '@/utils/toast'

const pinSchema = z
  .object({
    currentPin: z.string().min(1, 'Enter your current PIN.'),
    newPin: z
      .string()
      .min(4, 'Your PIN must be at least 4 digits.')
      .max(8, 'Your PIN can be at most 8 digits.')
      .regex(/^[0-9]+$/, 'Your PIN must be digits only.'),
    confirmPin: z.string().min(1, 'Re-enter your new PIN.'),
  })
  .refine((v) => v.newPin === v.confirmPin, {
    path: ['confirmPin'],
    message: 'The two PINs do not match.',
  })
  .refine((v) => v.newPin !== v.currentPin, {
    path: ['newPin'],
    message: 'Your new PIN must be different from the current one.',
  })

type PinSchema = z.infer<typeof pinSchema>

/**
 * Change the PIN used to sign in to the business panel. Owners and admins sign
 * in with mobile + PIN, so this is their only credential.
 *
 * The session is untouched by the change — the server keeps existing tokens
 * valid, so there is no sign-out/sign-in round trip.
 */
export function ChangePinCard() {
  const [saving, setSaving] = useState(false)
  const form = useForm<PinSchema>({
    resolver: zodResolver(pinSchema),
    defaultValues: { currentPin: '', newPin: '', confirmPin: '' },
  })

  async function onSubmit(values: PinSchema) {
    setSaving(true)
    try {
      await authService.changePin(values.currentPin, values.newPin)
      form.reset()
      toast.success('PIN updated.')
    } catch (error) {
      // The server rejects a wrong current PIN (and rate-limits repeats) — put
      // that message on the field it belongs to rather than only in a toast.
      if (error instanceof ApiError) {
        const fieldErrors = error.errors ?? {}
        let shown = false
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (field === 'currentPin' || field === 'newPin') {
            form.setError(field, { message: messages[0] })
            shown = true
          }
        }
        if (!shown) toast.error(error.message)
      } else {
        toast.error(MESSAGES.errors.generic)
      }
    } finally {
      setSaving(false)
    }
  }

  const { errors } = form.formState

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-body-lg font-semibold text-foreground">Change PIN</h2>
          <p className="text-caption text-text-secondary">The PIN you use to sign in.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PinField
          label="Current PIN"
          autoComplete="current-password"
          error={errors.currentPin?.message}
          {...form.register('currentPin')}
        />
        <PinField
          label="New PIN"
          autoComplete="new-password"
          error={errors.newPin?.message}
          {...form.register('newPin')}
        />
        <PinField
          label="Confirm new PIN"
          autoComplete="new-password"
          error={errors.confirmPin?.message}
          {...form.register('confirmPin')}
        />
      </div>

      <Button
        type="button"
        onClick={form.handleSubmit(onSubmit)}
        isLoading={saving}
        className="w-full sm:w-auto"
      >
        Update PIN
      </Button>
    </Card>
  )
}

/**
 * Rendered as its own labelled block. `inputMode="numeric"` gets the digit pad
 * on a phone; the field stays `type=password` via PasswordInput so the PIN is
 * masked with a reveal toggle.
 */
function PinField({
  label,
  error,
  ...props
}: ComponentProps<typeof PasswordInput> & { label: string; error?: string }) {
  const id = `pin-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput
        id={id}
        inputMode="numeric"
        maxLength={8}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
