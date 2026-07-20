import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { useAdminSettings, useUpdateSettings } from '@/features/admin/hooks/useAdmin'
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
    </div>
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
