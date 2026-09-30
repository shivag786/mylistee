import { useEffect, useRef, useState } from 'react'
import { Bell, Play, Trash2, Upload, CreditCard, KeyRound, LogIn, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import {
  useAdminSettings,
  useUpdateSettings,
  useUploadOrderSound,
  useRemoveOrderSound,
} from '@/features/admin/hooks/useAdmin'
import type { PlatformSettings } from '@/features/admin/types'

export function AdminSettingsPage() {
  const { data, isLoading, isError, refetch } = useAdminSettings()
  const update = useUpdateSettings()
  const [form, setForm] = useState<PlatformSettings | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (isLoading || !form) {
    if (isError) return <ErrorState onRetry={() => void refetch()} />
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading settings" />
      </div>
    )
  }

  function set<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    // Only this form's own fields. Payments and sign-in save from their own
    // cards; resending them from here would put back whatever this form loaded
    // with, undoing a change made in one of those cards since.
    const general: Partial<PlatformSettings> = {
      brandName: form.brandName,
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      currency: form.currency,
      timezone: form.timezone,
      defaultLanguage: form.defaultLanguage,
      maintenanceMode: form.maintenanceMode,
      maintenanceMessage: form.maintenanceMessage,
    }
    update.mutate(general, {
      onSuccess: () => toast.success('Settings saved'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save settings.'),
    })
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Platform settings</h1>
        <p className="text-caption text-text-secondary">Brand, locale and maintenance mode</p>
      </header>

      <Card elevation="soft" className="max-w-xl" padding="lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Brand name" id="s-brand">
            <Input id="s-brand" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email" id="s-email">
              <Input id="s-email" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
            </Field>
            <Field label="Support phone" id="s-phone">
              <Input id="s-phone" value={form.supportPhone} onChange={(e) => set('supportPhone', e.target.value)} />
            </Field>
            <Field label="Currency" id="s-currency">
              <Input id="s-currency" value={form.currency} onChange={(e) => set('currency', e.target.value)} maxLength={3} />
            </Field>
            <Field label="Timezone" id="s-tz">
              <Input id="s-tz" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
            </Field>
            <Field label="Default language" id="s-lang">
              <Input id="s-lang" value={form.defaultLanguage} onChange={(e) => set('defaultLanguage', e.target.value)} maxLength={8} />
            </Field>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Maintenance mode</p>
                <p className="text-caption text-text-secondary">Temporarily take the app offline</p>
              </div>
              <Switch checked={form.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} aria-label="Maintenance mode" />
            </div>
            {form.maintenanceMode && (
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="s-msg">Maintenance message</Label>
                <Textarea id="s-msg" value={form.maintenanceMessage} onChange={(e) => set('maintenanceMessage', e.target.value)} rows={2} />
              </div>
            )}
          </div>

          <Button type="submit" isLoading={update.isPending} fullWidth>
            Save settings
          </Button>
        </form>
      </Card>

      <PaymentsCard settings={data ?? form} />

      <LoginMethodsCard settings={data ?? form} />

      <OrderSoundCard currentUrl={form.orderSoundUrl} />
    </div>
  )
}

/**
 * Razorpay keys and the convenience fee.
 *
 * Saves only its own fields. The secrets are write-only: the API never sends
 * them back, so the inputs start empty and a "saved" mark shows one is stored.
 * Leaving a secret blank keeps the stored one -- which is what makes it safe to
 * change the fee without re-entering the keys.
 */
function PaymentsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const [keyId, setKeyId] = useState(settings.razorpayKeyId ?? '')
  const [keySecret, setKeySecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [fee, setFee] = useState(String(settings.razorpayFeePercent ?? 2))

  useEffect(() => {
    setKeyId(settings.razorpayKeyId ?? '')
    setFee(String(settings.razorpayFeePercent ?? 2))
  }, [settings.razorpayKeyId, settings.razorpayFeePercent])

  const feeNumber = Number(fee)
  const feeValid = fee.trim() !== '' && Number.isFinite(feeNumber) && feeNumber >= 0 && feeNumber <= 10
  const keyIdValid = keyId.trim() === '' || /^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId.trim())
  const isLive = keyId.trim().startsWith('rzp_live_')

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!feeValid || !keyIdValid) return
    update.mutate(
      {
        razorpayKeyId: keyId.trim(),
        // Blank is "keep what is stored", never "clear it".
        razorpayKeySecret: keySecret.trim(),
        razorpayWebhookSecret: webhookSecret.trim(),
        razorpayFeePercent: feeNumber,
      },
      {
        onSuccess: () => {
          // Drop the typed secrets: they are saved, and holding them in the form
          // would resend them on the next save for no reason.
          setKeySecret('')
          setWebhookSecret('')
          toast.success('Payment settings saved')
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save payment settings.'),
      },
    )
  }

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold text-foreground">Payments</p>
            <p className="text-caption text-text-secondary">
              Razorpay keys for online orders and plan purchases. Left blank, the server&apos;s own
              keys are used.
            </p>
          </div>
        </div>

        <Field label="Key id" id="rzp-key">
          <Input
            id="rzp-key"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="rzp_live_…"
            autoComplete="off"
            aria-invalid={!keyIdValid}
          />
          {!keyIdValid && (
            <p className="text-small text-danger">A Razorpay key id starts with rzp_test_ or rzp_live_.</p>
          )}
          {isLive && keyIdValid && (
            <p className="text-small text-text-secondary">Live key -- customers will be charged real money.</p>
          )}
        </Field>

        <SecretField
          id="rzp-secret"
          label="Key secret"
          value={keySecret}
          onChange={setKeySecret}
          stored={settings.razorpayKeySecretSet}
        />
        <SecretField
          id="rzp-webhook"
          label="Webhook secret"
          value={webhookSecret}
          onChange={setWebhookSecret}
          stored={settings.razorpayWebhookSecretSet}
          hint="From Razorpay Dashboard > Webhooks. Without it, a payment made after the customer closes the tab is only picked up by the 30-minute sweep."
        />

        <Field label="Convenience fee on online payments (%)" id="rzp-fee">
          <Input
            id="rzp-fee"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            max={10}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            aria-invalid={!feeValid}
            className="max-w-[140px]"
          />
          <p className={feeValid ? 'text-small text-text-muted' : 'text-small text-danger'}>
            {feeValid
              ? `Added to the customer's bill. On a ₹200 online payment the customer pays ₹${(200 + (200 * feeNumber) / 100).toFixed(2)}.`
              : 'Enter a percentage between 0 and 10.'}
          </p>
        </Field>

        <Button type="submit" isLoading={update.isPending} disabled={!feeValid || !keyIdValid} fullWidth>
          Save payment settings
        </Button>
      </form>
    </Card>
  )
}

function SecretField({
  id,
  label,
  value,
  onChange,
  stored,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  stored: boolean
  hint?: string
}) {
  return (
    <Field label={label} id={id}>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={stored ? 'Saved -- type to replace' : 'Not set'}
        autoComplete="new-password"
      />
      <p className="inline-flex items-center gap-1 text-small text-text-muted">
        {stored ? (
          <>
            <CheckCircle2 className="size-3.5 text-success" aria-hidden /> A secret is saved. Leave blank to keep it.
          </>
        ) : (
          <>
            <KeyRound className="size-3.5" aria-hidden /> No secret saved yet.
          </>
        )}
      </p>
      {hint && <p className="text-small text-text-muted">{hint}</p>}
    </Field>
  )
}

/**
 * Which sign-in methods the customer login page shows.
 *
 * At least one stays on -- the server enforces it, and the last switch is
 * disabled here so the admin sees why rather than having their change undone.
 */
function LoginMethodsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()

  function toggle(key: 'loginGoogle' | 'loginMobile', next: boolean) {
    update.mutate(
      { [key]: next },
      {
        onSuccess: () => toast.success('Sign-in options updated'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not update sign-in options.'),
      },
    )
  }

  const onlyGoogle = settings.loginGoogle && !settings.loginMobile
  const onlyMobile = settings.loginMobile && !settings.loginGoogle

  return (
    <Card elevation="soft" className="max-w-xl space-y-3" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <LogIn className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">Customer sign-in</p>
          <p className="text-caption text-text-secondary">
            Choose what the login page offers. Business owners and admins always sign in with mobile
            and PIN, whatever is chosen here.
          </p>
        </div>
      </div>

      <MethodRow
        title="Google"
        body="One tap with a Google account."
        checked={settings.loginGoogle}
        disabled={onlyGoogle || update.isPending}
        onChange={(v) => toggle('loginGoogle', v)}
      />
      <MethodRow
        title="Mobile number + PIN"
        body="The customer picks a PIN the first time. No OTP."
        checked={settings.loginMobile}
        disabled={onlyMobile || update.isPending}
        onChange={(v) => toggle('loginMobile', v)}
      />

      {(onlyGoogle || onlyMobile) && (
        <p className="text-small text-text-muted">At least one method has to stay on.</p>
      )}
      {!settings.loginGoogle && (
        // Switching Google off strands anyone who only ever signed in with it:
        // they have no PIN. Say so where the switch is.
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-small text-foreground">
          Customers who only ever used Google cannot sign in while it is off -- they have no PIN
          yet.
        </p>
      )}
    </Card>
  )
}

function MethodRow({
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  title: string
  body: string
  checked: boolean
  disabled: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-caption text-text-secondary">{body}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={`${title} sign-in`} />
    </div>
  )
}

/**
 * Upload a custom new-order alert sound owners hear when an order arrives. Empty
 * = the built-in synthesized "ding". Applies platform-wide via GET /config.
 */
function OrderSoundCard({ currentUrl }: { currentUrl: string | null }) {
  const upload = useUploadOrderSound()
  const remove = useRemoveOrderSound()
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    upload.mutate(file, {
      onSuccess: () => toast.success('Order sound updated'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not upload that sound.'),
    })
  }

  function preview() {
    if (!currentUrl) return
    audioRef.current ??= new Audio(currentUrl)
    if (audioRef.current.src !== currentUrl) audioRef.current.src = currentUrl
    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => toast.error('Could not play the sound.'))
  }

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Bell className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Order alert sound</p>
          <p className="text-caption text-text-secondary">
            Plays on the owner’s order screen when a new order arrives. MP3/WAV/OGG, up to 1 MB.
            Leave empty for the built-in ding.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              onChange={onPick}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              leftIcon={<Upload className="size-4" />}
              isLoading={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {currentUrl ? 'Replace sound' : 'Upload sound'}
            </Button>
            {currentUrl && (
              <>
                <Button type="button" size="sm" variant="outline" leftIcon={<Play className="size-4" />} onClick={preview}>
                  Preview
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 className="size-4 text-destructive" />}
                  isLoading={remove.isPending}
                  onClick={() =>
                    remove.mutate(undefined, {
                      onSuccess: () => toast.success('Reverted to the default sound'),
                      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not remove the sound.'),
                    })
                  }
                >
                  Remove
                </Button>
              </>
            )}
          </div>
          <p className="mt-2 text-small text-text-muted">
            {currentUrl ? 'A custom sound is active.' : 'Using the built-in ding.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
