import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, KeyRound, Link2, Mail, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useUpdateSettings } from '../hooks/useAdmin'
import { adminService } from '../services/adminService'
import type { PlatformSettings } from '../types'

/** Recommended reminder text — what the "Use recommended" button fills in. */
const RECOMMENDED = {
  title: 'Your personal link expires in {days}',
  body: 'Hi {shop}, your personal shop link stops on {date}. Renew now so customers who scan your QR keep seeing only your shop.',
}

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

/** Personal link: trial + pack prices. */
export function PersonalLinkPricingCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const [form, setForm] = useState(() => pricing(settings))
  useEffect(() => setForm(pricing(settings)), [settings])

  const valid = Object.values(form).every((v) => v.trim() !== '' && Number(v) >= 0)

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    update.mutate(
      {
        personalLinkTrialDays: Number(form.trial),
        personalLinkPrice30: Number(form.p30),
        personalLinkPrice90: Number(form.p90),
        personalLinkPrice365: Number(form.p365),
      },
      {
        onSuccess: () => toast.success('Personal link prices saved'),
        onError: (err) => toast.error(errorText(err, 'Could not save prices.')),
      },
    )
  }

  const field = (key: keyof typeof form, label: string, hint: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pl-${key}`}>{label}</Label>
      <Input
        id={`pl-${key}`}
        type="number"
        inputMode="numeric"
        min={0}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
      <p className="text-small text-text-muted">{hint}</p>
    </div>
  )

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <form onSubmit={save} className="space-y-4">
        <CardHead icon={<Link2 className="size-5" />} title="Personal link packs">
          Shops switch on their personal link for a free trial, then buy a pack. ₹5/day is the reference rate shown
          struck-through.
        </CardHead>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('trial', 'Free trial (days)', 'Given once per shop')}
          {field('p30', '30 days (₹)', 'Recommended ₹150')}
          {field('p90', '90 days (₹)', 'Recommended ₹399 (regular ₹450)')}
          {field('p365', '1 year (₹)', 'Recommended ₹1499 (regular ₹1825)')}
        </div>
        <Button type="submit" isLoading={update.isPending} disabled={!valid} fullWidth>
          Save packs
        </Button>
      </form>
    </Card>
  )
}

function pricing(s: PlatformSettings) {
  return {
    trial: String(s.personalLinkTrialDays ?? 7),
    p30: String(s.personalLinkPrice30 ?? 150),
    p90: String(s.personalLinkPrice90 ?? 399),
    p365: String(s.personalLinkPrice365 ?? 1499),
  }
}

/**
 * Expiry reminders. Off until the admin switches them on; once a day from N
 * days before expiry. In-app + push always (no email needed); email optional
 * through a Gmail account with an App Password.
 */
export function PersonalLinkRemindersCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const [days, setDays] = useState(String(settings.personalLinkReminderDays ?? 2))
  const [title, setTitle] = useState(settings.personalLinkReminderTitle ?? RECOMMENDED.title)
  const [body, setBody] = useState(settings.personalLinkReminderBody ?? RECOMMENDED.body)
  const [gmail, setGmail] = useState(settings.gmailAddress ?? '')
  const [appPassword, setAppPassword] = useState('')
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setDays(String(settings.personalLinkReminderDays ?? 2))
    setTitle(settings.personalLinkReminderTitle ?? RECOMMENDED.title)
    setBody(settings.personalLinkReminderBody ?? RECOMMENDED.body)
    setGmail(settings.gmailAddress ?? '')
  }, [settings])

  function toggle(key: 'personalLinkReminderEnabled' | 'personalLinkReminderEmail', value: boolean) {
    update.mutate(
      { [key]: value },
      {
        onSuccess: () =>
          toast.success(
            key === 'personalLinkReminderEnabled'
              ? value
                ? 'Reminders on — sent daily at 10:00 AM'
                : 'Reminders off'
              : value
                ? 'Email reminders on'
                : 'Email reminders off',
          ),
        onError: (err) => toast.error(errorText(err, 'Could not save.')),
      },
    )
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(
      {
        personalLinkReminderDays: Number(days) || 2,
        personalLinkReminderTitle: title.trim() || RECOMMENDED.title,
        personalLinkReminderBody: body.trim() || RECOMMENDED.body,
        gmailAddress: gmail.trim(),
        gmailAppPassword: appPassword.trim(),
      },
      {
        onSuccess: () => {
          setAppPassword('')
          toast.success('Reminder settings saved')
        },
        onError: (err) => toast.error(errorText(err, 'Could not save reminder settings.')),
      },
    )
  }

  async function sendTest() {
    if (!testTo.trim()) return
    setTesting(true)
    try {
      await adminService.testEmail(testTo.trim())
      toast.success('Test email sent — check the inbox (and spam)')
    } catch (err) {
      toast.error(errorText(err, 'Could not send the test email.'))
    } finally {
      setTesting(false)
    }
  }

  const preview = (text: string) =>
    text.replaceAll('{shop}', 'Sharma Sweets').replaceAll('{days}', '2 days').replaceAll('{date}', '18 Oct 2026, 10:00 AM')

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <form onSubmit={save} className="space-y-4">
        <CardHead icon={<BellRing className="size-5" />} title="Personal link expiry reminders">
          Once a day (10:00 AM) to the shop owner, starting a few days before their link runs out. Sent as an app
          notification + push — no email needed.
        </CardHead>

        <ToggleRow
          title="Send reminders"
          hint="Off by default. Nothing is sent until you switch this on."
          checked={settings.personalLinkReminderEnabled}
          onChange={(v) => toggle('personalLinkReminderEnabled', v)}
          disabled={update.isPending}
        />

        <div className="space-y-1.5">
          <Label htmlFor="pl-days">Start reminding (days before expiry)</Label>
          <Input id="pl-days" type="number" min={1} max={15} value={days} onChange={(e) => setDays(e.target.value)} className="max-w-[140px]" />
          <p className="text-small text-text-muted">Recommended: 2 — the owner gets one reminder on each of the last 2 days.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pl-title">Message</Label>
            <button
              type="button"
              className="text-small font-semibold text-primary hover:underline"
              onClick={() => {
                setTitle(RECOMMENDED.title)
                setBody(RECOMMENDED.body)
              }}
            >
              Use recommended
            </button>
          </div>
          <Input id="pl-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <Textarea id="pl-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={500} aria-label="Message body" />
          <p className="text-small text-text-muted">
            Placeholders: <code>{'{shop}'}</code> shop name, <code>{'{days}'}</code> days left, <code>{'{date}'}</code> expiry date.
          </p>
          <div className="rounded-lg bg-surface-muted p-3 text-small">
            <p className="font-semibold text-foreground">{preview(title)}</p>
            <p className="text-text-secondary">{preview(body)}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <ToggleRow
            title="Also send by email"
            hint="Goes to the email on the shop's profile. Needs a Gmail account below."
            checked={settings.personalLinkReminderEmail}
            onChange={(v) => toggle('personalLinkReminderEmail', v)}
            disabled={update.isPending}
            icon={<Mail className="size-4" />}
          />
          <div className="space-y-1.5">
            <Label htmlFor="pl-gmail">Gmail address (sender)</Label>
            <Input id="pl-gmail" type="email" value={gmail} onChange={(e) => setGmail(e.target.value)} placeholder="yourbrand@gmail.com" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-apppw">Gmail App Password</Label>
            <Input
              id="pl-apppw"
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder={settings.gmailAppPasswordSet ? 'Saved -- type to replace' : 'abcd efgh ijkl mnop'}
              autoComplete="new-password"
            />
            <p className="inline-flex items-center gap-1 text-small text-text-muted">
              {settings.gmailAppPasswordSet ? (
                <>
                  <CheckCircle2 className="size-3.5 text-success" aria-hidden /> Saved. Leave blank to keep it.
                </>
              ) : (
                <>
                  <KeyRound className="size-3.5" aria-hidden /> Not your normal password: turn on 2-Step Verification, then
                  Google Account → Security → App passwords → create one.
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Send a test to…" aria-label="Test email address" />
            <Button type="button" variant="outline" size="md" leftIcon={<Send className="size-4" />} isLoading={testing} disabled={!testTo.trim() || !settings.gmailAppPasswordSet} onClick={() => void sendTest()}>
              Test
            </Button>
          </div>
        </div>

        <Button type="submit" isLoading={update.isPending} fullWidth>
          Save reminder settings
        </Button>
      </form>
    </Card>
  )
}

function CardHead({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-caption text-text-secondary">{children}</p>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  hint,
  checked,
  onChange,
  disabled,
  icon,
}: {
  title: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="inline-flex items-center gap-1.5 font-medium text-foreground">
          {icon}
          {title}
        </p>
        <p className="text-caption text-text-secondary">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </div>
  )
}
