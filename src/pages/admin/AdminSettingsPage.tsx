import { useEffect, useRef, useState } from 'react'
import { Bell, Play, Trash2, Upload } from 'lucide-react'
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
    update.mutate(form, {
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

      <OrderSoundCard currentUrl={form.orderSoundUrl} />
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
