import { useEffect, useRef, useState } from 'react'
import { Bell, ExternalLink, Smartphone, Play, Trash2, Upload, CreditCard, KeyRound, LogIn, CheckCircle2, Dices, Volume2, Sparkles } from 'lucide-react'
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
  useCustomerSound,
  useAdminPlans,
  useUpdatePlan,
} from '@/features/admin/hooks/useAdmin'
import type { PlatformSettings } from '@/features/admin/types'
import { AppIconCard, MenuCardColorsCard, ThemeCard } from '@/features/admin/components/AppearanceSettings'
import { VendorAppThemeCard } from '@/features/admin/components/VendorAppThemeCard'

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
        <p className="text-caption text-text-secondary">Brand, theme, locale and maintenance mode</p>
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

      <AppLinksCard settings={data ?? form} />
      <AppVersionsCard settings={data ?? form} />

      <ThemeCard settings={data ?? form} />

      <AppIconCard settings={data ?? form} />

      <MenuCardColorsCard settings={data ?? form} />

      <VendorAppThemeCard />

      <PaymentsCard settings={data ?? form} />

      <LoginMethodsCard settings={data ?? form} />
      <SpinCountsCard settings={data ?? form} />

      <OrderSoundCard currentUrl={form.orderSoundUrl} />
      <CustomerSoundsCard settings={data ?? form} />
      <AiAssistantCard settings={data ?? form} />
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

/**
 * Spin & win social proof: whether customers see how many people played and
 * won at each shop ("1,240 played · 860 won") in the app and on the site.
 */
function SpinCountsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()

  return (
    <Card elevation="soft" className="max-w-xl space-y-3" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Dices className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">Spin &amp; win</p>
          <p className="text-caption text-text-secondary">
            Showing how many customers played and won makes the wheel more inviting.
          </p>
        </div>
      </div>
      <MethodRow
        title="Show play and win counts"
        body={'e.g. "1,240 played · 860 won" on each shop’s wheel.'}
        checked={settings.spinShowCounts ?? true}
        disabled={update.isPending}
        onChange={(v) =>
          update.mutate(
            { spinShowCounts: v },
            {
              onSuccess: () => toast.success(v ? 'Spin counts shown' : 'Spin counts hidden'),
              onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not update.'),
            },
          )
        }
      />
    </Card>
  )
}

/**
 * Sounds in the customer app: one when the customer places an order, one when
 * the shop accepts it. Empty = the app's built-in tones.
 */
function CustomerSoundsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const sound = useCustomerSound()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function preview(url: string | null) {
    if (!url) return
    audioRef.current ??= new Audio()
    audioRef.current.src = url
    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => toast.error('Could not play the sound.'))
  }

  const rows: { kind: 'placed' | 'accepted'; title: string; body: string; url: string | null }[] = [
    { kind: 'placed', title: 'Order placed', body: 'Plays when the customer places an order.', url: settings.customerSoundPlacedUrl ?? null },
    { kind: 'accepted', title: 'Order accepted', body: 'Plays when the shop accepts it (and on that push).', url: settings.customerSoundAcceptedUrl ?? null },
  ]

  return (
    <Card elevation="soft" className="max-w-xl space-y-3" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Volume2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Customer app sounds</p>
          <p className="text-caption text-text-secondary">
            Short tones in the customer app. MP3/WAV/OGG up to 1 MB; leave empty for the built-in tones.
          </p>
        </div>
      </div>
      <MethodRow
        title="Play order sounds"
        body="Switch off to keep the customer app silent."
        checked={settings.customerSoundsEnabled ?? true}
        disabled={update.isPending}
        onChange={(v) =>
          update.mutate(
            { customerSoundsEnabled: v },
            { onSuccess: () => toast.success(v ? 'Order sounds on' : 'Order sounds off') },
          )
        }
      />
      {rows.map((row) => (
        <div key={row.kind} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold text-foreground">{row.title}</p>
            <p className="text-small text-text-muted">{row.url ? 'Custom sound' : 'Built-in tone'} · {row.body}</p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                sound.upload.mutate(
                  { kind: row.kind, file },
                  {
                    onSuccess: () => toast.success('Sound updated'),
                    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not upload that sound.'),
                  },
                )
              }}
            />
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-small font-semibold text-primary-foreground">
              <Upload className="size-4" aria-hidden /> {row.url ? 'Replace' : 'Upload'}
            </span>
          </label>
          {row.url && (
            <>
              <Button type="button" size="sm" variant="outline" leftIcon={<Play className="size-4" />} onClick={() => preview(row.url)}>
                Play
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<Trash2 className="size-4 text-destructive" />}
                onClick={() => sound.remove.mutate(row.kind, { onSuccess: () => toast.success('Back to the built-in tone') })}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      ))}
    </Card>
  )
}

const AI_DEFAULT_MODEL = { gemini: 'gemini-3.1-flash-lite', openai: 'gpt-4o-mini' } as const

/**
 * The vendor app's AI assistant: on/off, the provider (Google Gemini — free
 * tier — or OpenAI), its API key (never shown again once saved), the model and
 * a monthly cap per shop. Which plans get it is set per plan under Plans →
 * "AI assistant".
 */
function AiAssistantCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const [provider, setProvider] = useState<'gemini' | 'openai'>(settings.aiProvider ?? 'gemini')
  const [key, setKey] = useState('')
  const savedModel = provider === 'gemini' ? settings.geminiModel : settings.openaiModel
  const [model, setModel] = useState(savedModel ?? AI_DEFAULT_MODEL[provider])
  const [limit, setLimit] = useState(String(settings.aiMonthlyLimit ?? 100))
  const [scanLimit, setScanLimit] = useState(String(settings.aiMenuScanLimit ?? 30))
  const keySet = provider === 'gemini' ? settings.geminiApiKeySet : settings.openaiApiKeySet
  const savedProvider = settings.aiProvider ?? 'gemini'
  const savedKeySet = savedProvider === 'gemini' ? settings.geminiApiKeySet : settings.openaiApiKeySet

  useEffect(() => {
    setProvider(settings.aiProvider ?? 'gemini')
    setLimit(String(settings.aiMonthlyLimit ?? 100))
    setScanLimit(String(settings.aiMenuScanLimit ?? 30))
  }, [settings.aiProvider, settings.aiMonthlyLimit, settings.aiMenuScanLimit])

  useEffect(() => {
    setModel(savedModel ?? AI_DEFAULT_MODEL[provider])
    setKey('')
  }, [provider, savedModel])

  function save() {
    const trimmedKey = key.trim()
    update.mutate(
      {
        aiProvider: provider,
        ...(provider === 'gemini'
          ? { ...(trimmedKey ? { geminiApiKey: trimmedKey } : {}), geminiModel: model.trim() || AI_DEFAULT_MODEL.gemini }
          : { ...(trimmedKey ? { openaiApiKey: trimmedKey } : {}), openaiModel: model.trim() || AI_DEFAULT_MODEL.openai }),
        aiMonthlyLimit: Math.max(0, Number.parseInt(limit, 10) || 0),
        aiMenuScanLimit: Math.max(0, Number.parseInt(scanLimit, 10) || 0),
      },
      {
        onSuccess: () => {
          setKey('')
          toast.success('AI assistant settings saved')
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save.'),
      },
    )
  }

  return (
    <Card elevation="soft" className="max-w-xl space-y-3" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">AI assistant (vendor app)</p>
          <p className="text-caption text-text-secondary">
            Shop owners get dish descriptions, offer and combo ideas, notification messages, sales tips and review
            replies, and tap one to use it. Choose which plans include it under Plans → “AI assistant”.
          </p>
        </div>
      </div>
      <MethodRow
        title="Turn on the AI assistant"
        body={
          savedKeySet
            ? `Using ${savedProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} — a key is saved.`
            : `Save a ${savedProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key first.`
        }
        checked={settings.aiEnabled ?? false}
        disabled={update.isPending || (!savedKeySet && !settings.aiEnabled)}
        onChange={(v) => update.mutate({ aiEnabled: v }, { onSuccess: () => toast.success(v ? 'AI assistant on' : 'AI assistant off') })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ai-provider">Provider</Label>
          <select
            id="ai-provider"
            className="h-[52px] w-full rounded-input border border-border bg-surface px-3 text-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={provider}
            onChange={(e) => setProvider(e.target.value === 'openai' ? 'openai' : 'gemini')}
          >
            <option value="gemini">Google Gemini (free tier — key from aistudio.google.com)</option>
            <option value="openai">OpenAI (paid)</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ai-key">{provider === 'gemini' ? 'Gemini API key' : 'OpenAI API key'}</Label>
          <Input
            id="ai-key"
            type="password"
            autoComplete="off"
            value={key}
            placeholder={keySet ? '•••••••• saved (type to replace)' : provider === 'gemini' ? 'Paste key from AI Studio' : 'sk-...'}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ai-model">Model</Label>
          <Input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={AI_DEFAULT_MODEL[provider]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ai-limit">Fallback: shops with no plan at all</Label>
          <Input id="ai-limit" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} />
          <p className="text-small text-text-muted">
            Rarely used — every shop normally has a plan (free included). Set each plan’s quota below.
          </p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ai-scan-limit">Menu scans per shop / month (every plan, needs Gemini)</Label>
          <Input
            id="ai-scan-limit"
            inputMode="numeric"
            value={scanLimit}
            onChange={(e) => setScanLimit(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" size="sm" isLoading={update.isPending} onClick={save}>
          Save AI settings
        </Button>
      </div>
      <AiPlanQuotas />
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

/** Play Store pages of the customer and vendor apps — used on shop posters, the website and in messages. */
function AppLinksCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const [customer, setCustomer] = useState(settings.playStoreCustomerUrl ?? '')
  const [vendor, setVendor] = useState(settings.playStoreVendorUrl ?? '')

  useEffect(() => {
    setCustomer(settings.playStoreCustomerUrl ?? '')
    setVendor(settings.playStoreVendorUrl ?? '')
  }, [settings.playStoreCustomerUrl, settings.playStoreVendorUrl])

  const valid = (u: string) => u.trim() === '' || /^https:\/\/\S+$/.test(u.trim())

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!valid(customer) || !valid(vendor)) return toast.error('Links must start with https://')
    update.mutate(
      { playStoreCustomerUrl: customer.trim(), playStoreVendorUrl: vendor.trim() },
      {
        onSuccess: () => toast.success('App links saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save app links.'),
      },
    )
  }

  const row = (id: string, label: string, hint: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <Field label={label} id={id}>
      <div className="flex gap-2">
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!valid(value)} />
        {value.trim() && valid(value) && (
          <a href={value.trim()} target="_blank" rel="noreferrer" className="grid size-11 shrink-0 place-items-center rounded-input border border-border text-text-secondary hover:bg-surface-muted" aria-label={`Open ${label}`}>
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      <p className="text-small text-text-muted">{hint}</p>
    </Field>
  )

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">App store links</p>
            <p className="text-caption text-text-secondary">Play Store pages of both apps — shown on shop posters and the website</p>
          </div>
        </div>
        {row('s-play-customer', 'Customer app (Listee)', 'org.listee.app', customer, setCustomer, 'https://play.google.com/store/apps/details?id=org.listee.app')}
        {row('s-play-vendor', 'Vendor app (Listee Business)', 'org.listee.business', vendor, setVendor, 'https://play.google.com/store/apps/details?id=org.listee.business')}
        <Button type="submit" isLoading={update.isPending} fullWidth>Save app links</Button>
      </form>
    </Card>
  )
}

/**
 * Version gates for the two phone apps. Below "minimum" an app must update;
 * below "latest" it may show a "new version" nudge. Blank = no gate. The apps
 * read these from /config.
 */
function AppVersionsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const keys = ['customerAppMinVersion', 'customerAppLatestVersion', 'vendorAppMinVersion', 'vendorAppLatestVersion'] as const
  const [v, setV] = useState(() => Object.fromEntries(keys.map((k) => [k, settings[k] ?? ''])) as Record<(typeof keys)[number], string>)
  const [message, setMessage] = useState(settings.appUpdateMessage ?? '')

  useEffect(() => {
    setV(Object.fromEntries(keys.map((k) => [k, settings[k] ?? ''])) as Record<(typeof keys)[number], string>)
    setMessage(settings.appUpdateMessage ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.customerAppMinVersion, settings.customerAppLatestVersion, settings.vendorAppMinVersion, settings.vendorAppLatestVersion, settings.appUpdateMessage])

  const ok = (x: string) => x.trim() === '' || /^\d+\.\d+(\.\d+)?$/.test(x.trim())
  const allOk = keys.every((k) => ok(v[k]))

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!allOk) return toast.error('Versions look like 1.2.1')
    update.mutate(
      { ...Object.fromEntries(keys.map((k) => [k, v[k].trim()])), appUpdateMessage: message.trim() },
      {
        onSuccess: () => toast.success('App versions saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save app versions.'),
      },
    )
  }

  const input = (k: (typeof keys)[number], label: string) => (
    <Field label={label} id={`s-${k}`}>
      <Input id={`s-${k}`} value={v[k]} placeholder="e.g. 1.2.1" aria-invalid={!ok(v[k])} onChange={(e) => setV((o) => ({ ...o, [k]: e.target.value }))} />
    </Field>
  )

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <form onSubmit={save} className="space-y-4">
        <div>
          <p className="font-semibold text-foreground">App versions</p>
          <p className="text-caption text-text-secondary">
            Below the minimum, the app asks to update before it can be used. Below the latest, it shows a gentle “update available”. Leave blank for no check.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {input('customerAppMinVersion', 'Customer app · minimum')}
          {input('customerAppLatestVersion', 'Customer app · latest')}
          {input('vendorAppMinVersion', 'Vendor app · minimum')}
          {input('vendorAppLatestVersion', 'Vendor app · latest')}
        </div>
        <Field label="Update message" id="s-update-msg">
          <Textarea id="s-update-msg" rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Button type="submit" isLoading={update.isPending} disabled={!allOk} fullWidth>Save app versions</Button>
      </form>
    </Card>
  )
}

/**
 * AI answers a month for each plan — the free plan's quota is what free shops
 * get. Saved straight to the plan (same as Plans → AI answers / month).
 * Blank = unlimited, 0 = AI off for that plan.
 */
function AiPlanQuotas() {
  const { data: plans } = useAdminPlans()
  const updatePlan = useUpdatePlan()
  const list = [...(plans ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.price - b.price)
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    if (plans) setDraft(Object.fromEntries(plans.map((p) => [p.key, p.limits.aiAnswersPerMonth == null ? '' : String(p.limits.aiAnswersPerMonth)])))
  }, [plans])

  function save(key: string) {
    const raw = (draft[key] ?? '').trim()
    updatePlan.mutate(
      { key, payload: { aiAnswersPerMonth: raw === '' ? null : Math.max(0, Number.parseInt(raw, 10) || 0) } },
      {
        onSuccess: () => toast.success(raw === '' ? 'Unlimited AI answers for this plan' : raw === '0' ? 'AI is off for this plan' : `${raw} AI answers a month saved`),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save.'),
      },
    )
  }

  if (!plans || plans.length === 0) return null
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <p className="font-semibold text-foreground">AI answers per month — by plan</p>
        <p className="text-small text-text-secondary">
          How many AI answers a shop on each plan gets every month. The free plan’s number is what free shops get. Blank = unlimited, 0 = AI off.
          Shops can buy extra answers in AI packs.
        </p>
      </div>
      {list.map((p) => {
        const saved = p.limits.aiAnswersPerMonth == null ? '' : String(p.limits.aiAnswersPerMonth)
        const value = draft[p.key] ?? saved
        return (
          <div key={p.key} className="space-y-2 rounded-lg bg-surface-muted/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">
                {p.name} {p.isDefault && <span className="ml-1 rounded-full bg-success-soft px-2 py-0.5 text-small text-success">Free / default</span>}
              </p>
              <p className="text-small text-text-muted">Now: {saved === '' ? 'unlimited' : saved === '0' ? 'off' : `${saved} a month`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={`AI answers a month on ${p.name}`}
                inputMode="numeric"
                className="w-28"
                placeholder="∞"
                value={value}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value.replace(/\D/g, '') }))}
              />
              {[10, 20, 50, 100, 200, 500].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, [p.key]: String(n) }))}
                  className={`rounded-full border px-2.5 py-1 text-small ${value === String(n) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:bg-surface'}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, [p.key]: '' }))}
                className={`rounded-full border px-2.5 py-1 text-small ${value === '' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:bg-surface'}`}
              >
                Unlimited
              </button>
              <Button type="button" size="sm" variant="outline" disabled={value === saved || updatePlan.isPending} onClick={() => save(p.key)}>
                Save
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

