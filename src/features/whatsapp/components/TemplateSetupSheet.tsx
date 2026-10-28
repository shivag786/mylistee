import { useEffect, useState } from 'react'
import { Send, Save } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/services/apiClient'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { WhatsAppPreview } from './WhatsAppPreview'
import { VarEditor } from './VarEditor'
import { STATUS_LABEL, STATUS_TONE, countBlanks, sampleFor, type TemplateVariables, type WaAdminState, type WaTemplate } from '../types'

interface TemplateSetupSheetProps {
  template: WaTemplate | null
  state: WaAdminState
  onOpenChange: (open: boolean) => void
  onSaved: (t: WaTemplate) => void
}

/**
 * An existing template: its name for shops, whether shops may send it, and
 * how each blank is filled. The words themselves are fixed — WhatsApp approved
 * exactly those. Also sends a test to any number.
 */
export function TemplateSetupSheet({ template, state, onOpenChange, onSaved }: TemplateSetupSheetProps) {
  const [displayName, setDisplayName] = useState('')
  const [forShops, setForShops] = useState(false)
  const [vars, setVars] = useState<TemplateVariables>({ header: null, body: [], buttons: {} })
  const [testPhone, setTestPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!template) return
    setDisplayName(template.displayName)
    setForShops(template.forShops)
    const body = [...template.variables.body]
    while (body.length < countBlanks(template.body)) body.push({ source: 'custom', label: '' })
    setVars({ header: template.variables.header, body, buttons: { ...template.variables.buttons } })
  }, [template])

  if (!template) return null
  const t = template
  const isOtp = t.category === 'AUTHENTICATION'
  const kinds = isOtp ? ['otp', 'all'] : ['all', 'order', 'otp', 'shop']
  const headerHasBlank = t.headerFormat === 'TEXT' && countBlanks(t.header) > 0
  const hasImage = t.headerFormat === 'IMAGE'

  async function save() {
    setSaving(true)
    try {
      const saved = await apiClient.patch<WaTemplate>(`admin/whatsapp/templates/${t.id}`, { displayName, forShops, variables: vars })
      toast.success('Template saved')
      onSaved(saved)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    setTesting(true)
    try {
      await apiClient.post(`admin/whatsapp/templates/${t.id}/test`, { phone: testPhone })
      toast.success('Test sent', 'Check WhatsApp on that phone.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send the test.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {t.displayName}
            <Badge tone={STATUS_TONE[t.status] ?? 'neutral'}>{STATUS_LABEL[t.status] ?? t.status}</Badge>
          </SheetTitle>
          <SheetDescription>
            <span className="font-mono">{t.name}</span> · {t.category.toLowerCase()} · {t.language}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 px-4 pb-4 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {t.status === 'REJECTED' && (
              <p className="rounded-xl bg-destructive-soft p-3 text-caption text-destructive">
                WhatsApp rejected it{t.rejectionReason ? `: ${t.rejectionReason}` : '.'} Make a new one with changed words.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="ts-name">Name shops see</Label>
              <Input id="ts-name" value={displayName} maxLength={120} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            {t.category === 'MARKETING' && (
              <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <span>
                  <span className="block text-caption font-semibold text-foreground">Ready-made for shops</span>
                  <span className="text-small text-text-muted">Shop owners on a plan with WhatsApp offers can send it.</span>
                </span>
                <Switch checked={forShops} onCheckedChange={setForShops} />
              </label>
            )}

            <div className="space-y-2">
              <p className="text-caption font-medium text-foreground">What goes in each blank</p>
              {headerHasBlank && (
                <VarEditor name="Head" value={vars.header ?? { source: 'custom' }} sources={state.sources} kinds={kinds} onChange={(v) => setVars({ ...vars, header: v })} />
              )}
              {hasImage && (
                <VarEditor name="Image" value={vars.header ?? { source: 'template_image' }} sources={state.sources} kinds={['image']} onChange={(v) => setVars({ ...vars, header: v })} />
              )}
              {vars.body.map((v, i) => (
                <VarEditor
                  key={i}
                  name={`{{${i + 1}}}`}
                  value={v}
                  sources={state.sources}
                  kinds={kinds}
                  onChange={(next) => setVars({ ...vars, body: vars.body.map((x, j) => (j === i ? next : x)) })}
                />
              ))}
              {Object.entries(vars.buttons).map(([index, v]) => (
                <VarEditor
                  key={index}
                  name={`Btn ${Number(index) + 1}`}
                  value={v}
                  sources={state.sources}
                  kinds={kinds}
                  onChange={(next) => setVars({ ...vars, buttons: { ...vars.buttons, [index]: next } })}
                />
              ))}
              {vars.body.length === 0 && !headerHasBlank && Object.keys(vars.buttons).length === 0 && (
                <p className="text-small text-text-muted">This template has no blanks.</p>
              )}
            </div>

            <div className="space-y-1.5 rounded-xl border border-border p-3">
              <Label htmlFor="ts-test">Send a test</Label>
              <div className="flex gap-2">
                <Input id="ts-test" inputMode="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="10-digit mobile" />
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Send className="size-4" />}
                  disabled={t.status !== 'APPROVED' || testPhone.replace(/\D/g, '').length < 10}
                  isLoading={testing}
                  onClick={() => void test()}
                >
                  Test
                </Button>
              </div>
              <p className="text-small text-text-muted">
                {t.status === 'APPROVED' ? 'Blanks are filled with examples. Save first if you changed them.' : 'Testing works once WhatsApp approves it.'}
              </p>
            </div>
          </div>

          <div className="space-y-2 md:sticky md:top-4 md:self-start">
            <p className="text-small font-medium text-text-muted">Preview</p>
            <WhatsAppPreview
              headerFormat={t.headerFormat}
              header={t.header}
              headerValue={headerHasBlank ? sampleFor(vars.header ?? undefined, state.sources) : undefined}
              headerImageUrl={t.headerMediaUrl}
              body={t.body}
              values={vars.body.map((v) => sampleFor(v, state.sources))}
              footer={t.footer}
              buttons={t.buttons}
              shopName="Sharma Sweets"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button leftIcon={<Save className="size-4" />} isLoading={saving} disabled={vars.body.some((v) => v.source === 'custom' && !v.label?.trim())} onClick={() => void save()}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
